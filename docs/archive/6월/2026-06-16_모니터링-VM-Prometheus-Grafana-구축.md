# 작업 로그: Monitoring VM Prometheus/Grafana 구축

| 항목 | 내용 |
|------|------|
| 날짜 | 2026-06-16 |
| 작성자 | rb |
| 작업 유형 | 모니터링 인프라 구성 |
| 관련 VM | `dragon-k3s`, `dragon-monitoring` |
| 관련 도구 | Prometheus, Grafana, node-exporter |

---

## 작업 배경

k3s에 배포된 Dragon University 서비스를 운영 환경에 가깝게 관찰하기 위해 모니터링 전용 VM을 새로 구성했다.

기존 구조는 아래와 같았다.

```txt
k3s VM
-> Frontend / Backend / MariaDB / Traefik Ingress 실행
-> sugang.drg 도메인으로 접근
```

여기에 별도 모니터링 VM을 추가해 Prometheus가 k3s VM의 node-exporter 지표를 수집하고,
Grafana에서 CPU, Memory, Disk, Network 상태를 시각화하도록 구성했다.

---

## VM/IP 정리

| 역할 | Hostname | IP | 주요 포트 | 설명 |
|------|----------|----|----------|------|
| k3s runtime | `dragon-k3s` | `192.168.232.133` | `80`, `443`, `9100` | Frontend/Backend/MariaDB/Traefik 실행, node-exporter target |
| Monitoring | `dragon-monitoring` | `192.168.232.135` | `22`, `3000`, `9090`, `9100` | Prometheus/Grafana 실행, 자체 node-exporter target |

접속 주소:

```txt
Prometheus: http://192.168.232.135:9090
Prometheus Targets: http://192.168.232.135:9090/targets
Grafana: http://192.168.232.135:3000
k3s node-exporter: http://192.168.232.133:9100/metrics
monitoring node-exporter: http://192.168.232.135:9100/metrics
```

---

## 작업 내용

### 1. Monitoring VM 생성

노트북 용량이 부족해 처음에는 10GB 디스크를 고려했지만,
Prometheus가 시계열 데이터를 계속 저장하므로 최종적으로 20GB 디스크로 생성했다.

최종 VM 기준:

| 항목 | 값 |
|------|----|
| OS | Ubuntu Server |
| Disk | 20GB |
| CPU | 2 vCPU 권장 |
| Memory | 2GB 이상, 가능하면 4GB |
| Hostname | `dragon-monitoring` |

### 2. SSH 접속 문제 해결

Mac에서 아래 명령으로 접속을 시도했다.

```bash
ssh ruby@192.168.232.135
```

처음에는 아래 에러가 발생했다.

```txt
ssh: connect to host 192.168.232.135 port 22: Connection refused
```

원인:

- VM 네트워크는 연결되어 있어 `ping`은 성공함
- 하지만 Ubuntu VM에 `openssh-server`가 설치되어 있지 않아 22번 포트가 열려 있지 않았음

해결:

```bash
sudo apt update
sudo apt install -y openssh-server
sudo systemctl enable --now ssh
sudo systemctl status ssh
```

설치 후 Mac iTerm2에서 SSH 접속이 정상 동작했다.

### 3. Prometheus/Grafana 설치

Monitoring VM에 아래 도구를 설치했다.

```txt
Prometheus
Grafana
prometheus-node-exporter
```

확인 주소:

```txt
Prometheus: http://192.168.232.135:9090
Grafana: http://192.168.232.135:3000
```

Grafana 초기 계정:

```txt
ID: admin
PW: admin
```

초기 로그인 후 새 비밀번호를 설정했다.

### 4. k3s VM node-exporter 확인

k3s VM IP:

```txt
192.168.232.133
```

k3s VM에서 node-exporter 지표 확인:

```bash
curl http://192.168.232.133:9100/metrics | head
```

출력 예시:

```txt
# HELP apt_autoremove_pending Apt packages pending autoremoval.
# TYPE apt_autoremove_pending gauge
apt_autoremove_pending 0
```

마지막에 아래 에러가 나왔다.

```txt
curl: (23) Failure writing output to destination
```

원인:

- `| head`가 앞 10줄만 받고 먼저 종료함
- `curl`은 나머지 데이터를 쓰려다가 출력 대상이 닫혀 에러를 표시함
- 지표 수집 실패가 아니라 정상적인 파이프 동작으로 볼 수 있음

### 5. Prometheus target 추가

Monitoring VM의 Prometheus 설정 파일을 수정했다.

```bash
sudo nano /etc/prometheus/prometheus.yml
```

`scrape_configs`에 node-exporter target을 추가했다.

```yaml
scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets:
          - 'localhost:9100'
          - '192.168.232.133:9100'
```

nano 저장/종료:

```txt
Ctrl + O
Enter
Ctrl + X
```

Prometheus 재시작:

```bash
sudo systemctl restart prometheus
sudo systemctl status prometheus
```

### 6. Prometheus 쿼리 확인

Prometheus query 창에 IP를 그대로 입력하면 아래 에러가 발생했다.

```txt
Error executing query: invalid parameter "query": 1:8: parse error: unexpected number ".232"
```

원인:

- Prometheus query 창은 PromQL을 입력하는 곳임
- `192.168.232.133:9100` 같은 IP 문자열을 그대로 넣으면 문법 오류가 발생함

해결:

```promql
up{instance="192.168.232.133:9100"}
```

결과:

```txt
value = 1
```

의미:

```txt
Prometheus가 dragon-k3s node-exporter를 정상 scrape 중
```

### 7. Grafana Dashboard 연결

Grafana에서 Prometheus datasource를 추가했다.

Datasource URL:

```txt
http://localhost:9090
```

주의:

- Grafana와 Prometheus가 같은 monitoring VM 안에서 실행되므로 Grafana 설정에서는 `localhost:9090` 사용
- Mac 브라우저에서 Prometheus에 접속할 때는 `localhost`가 아니라 `192.168.232.135:9090` 사용

Dashboard Import:

```txt
Dashboard ID: 1860
Dashboard: Node Exporter Full
```

처음에는 Grafana dashboard가 `No data`로 표시되었다.

원인:

- dashboard 상단 변수에서 `job` 값이 Prometheus 설정의 `job_name`과 맞지 않았음

해결:

```txt
job = node-exporter
instance = 192.168.232.133:9100
```

이후 CPU, Memory, Disk, Network 지표가 정상 출력되었다.

---

## 최종 상태

```txt
dragon-k3s
192.168.232.133
node-exporter :9100
        ↓
dragon-monitoring
192.168.232.135
Prometheus :9090
Grafana :3000
        ↓
Grafana Dashboard 1860
job = node-exporter
instance = 192.168.232.133:9100
```

현재 성공한 것:

- Monitoring VM SSH 접속 성공
- Prometheus 설치 및 접속 성공
- Grafana 설치 및 접속 성공
- k3s VM node-exporter target 수집 성공
- Prometheus `up` query 결과 `1` 확인
- Grafana Node Exporter Full dashboard 표시 성공
- `No data` 문제 해결

---

## 후속 작업

- `/admin/monitoring` 프론트 화면에 Grafana/Prometheus 링크 연결
- k3s VM과 monitoring VM 상태 카드 구성
- Jenkins VM까지 포함한 전체 인프라 표 정리
- 부하 테스트 시 Grafana 지표 변화 확인
- 필요 시 Grafana dashboard 캡처를 발표 자료에 사용
