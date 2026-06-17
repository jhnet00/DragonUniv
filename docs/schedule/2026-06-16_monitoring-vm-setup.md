# Monitoring VM 세팅 계획

작성일: 2026년 6월 16일  
목적: Dragon University k3s 배포 환경을 관찰하기 위한 별도 모니터링 VM 구성 기준을 정리한다.

---

## 1. 목표 구조

CI/CD, 실행 환경, 모니터링 역할을 분리한다.

```txt
VM 1: k3s runtime
- Frontend
- Backend
- MariaDB
- Traefik Ingress

VM 2: CI/CD
- Jenkins
- Docker CLI 또는 Docker Engine
- kubectl

VM 3: Monitoring
- Prometheus
- Grafana
- exporter 수집 대상 관리
```

이번 문서는 `VM 3: Monitoring` 기준이다.

---

## 2. 권장 VM 사양

Ubuntu는 기존 VM과 같은 계열로 맞춘다.

| 항목 | 권장값 |
|------|--------|
| OS | Ubuntu Server 22.04 LTS 또는 24.04 LTS |
| CPU | 2 vCPU |
| Memory | 2 GB 이상, 가능하면 4 GB |
| Disk | 30 GB 이상 |
| Network | k3s VM과 통신 가능한 같은 NAT/브리지 네트워크 |
| SSH | OpenSSH Server 설치 |

최소 실습은 2 vCPU / 2 GB / 30 GB로 가능하다.
Grafana와 Prometheus를 안정적으로 같이 쓰려면 4 GB 메모리를 권장한다.

---

## 3. 네트워크 준비

모니터링 VM에서 k3s VM으로 접근 가능해야 한다.

확인할 대상:

```txt
k3s VM IP
Monitoring VM IP
Jenkins VM IP
```

모니터링 VM에서 확인:

```bash
ping <k3s-vm-ip>
curl http://<k3s-vm-ip>:80
```

로컬 도메인 `sugang.drg`를 모니터링 VM에서도 쓰려면 `/etc/hosts`에 추가한다.

```bash
sudo nano /etc/hosts
```

예시:

```txt
<k3s-vm-ip> sugang.drg
```

---

## 4. 설치할 도구

Monitoring VM:

```txt
Prometheus
Grafana
curl
vim 또는 nano
net-tools 또는 iproute2
```

k3s VM 또는 k3s cluster 내부:

```txt
node-exporter
kube-state-metrics
metrics-server
```

초기에는 Prometheus/Grafana만 Monitoring VM에 설치하고,
k3s VM의 endpoint를 하나씩 붙이는 방식으로 진행한다.

---

## 5. 모니터링 대상

처음부터 모든 지표를 붙이기보다 아래 순서로 진행한다.

### 1단계: 서비스 생존 확인

대상:

```txt
http://sugang.drg/
http://sugang.drg/api/health
```

확인 항목:

```txt
HTTP status
응답 시간
실패 여부
```

### 2단계: k3s 노드 상태

대상:

```txt
CPU
Memory
Disk
Network
```

node-exporter를 사용한다.

### 3단계: Kubernetes 리소스 상태

대상:

```txt
Pod Running 상태
Deployment replica 수
Pod restart count
Service endpoint
```

kube-state-metrics 또는 kubectl 기반 확인으로 시작한다.

### 4단계: 애플리케이션 상태

대상:

```txt
Backend /api/health
MariaDB connection
Ingress route
```

---

## 6. Grafana 대시보드 초안

최소 대시보드 패널:

```txt
1. k3s VM CPU 사용률
2. k3s VM Memory 사용률
3. k3s VM Disk 사용률
4. Frontend/Backend Pod 상태
5. Backend API health 상태
6. HTTP 응답 시간
7. Pod restart count
```

발표용으로는 아래 흐름이 보이면 충분하다.

```txt
요청 증가
-> Backend replica 2개
-> Pod 상태 정상
-> CPU/Memory 변화 확인
-> 장애 없이 응답
```

---

## 7. 오늘 이후 작업 순서

1. Monitoring VM 생성
2. Ubuntu 설치 및 SSH 접속 확인
3. k3s VM과 네트워크 통신 확인
4. Prometheus 설치
5. Grafana 설치
6. k3s VM 또는 cluster에 exporter 구성
7. Prometheus target 등록
8. Grafana dashboard 구성
9. 간단 부하 테스트와 함께 지표 변화 확인

---

## 8. 주의 사항

- 모니터링 VM은 운영 앱을 실행하지 않는다.
- Prometheus scrape interval을 너무 짧게 잡지 않는다.
- VM 리소스가 부족하면 Grafana/Prometheus가 느려질 수 있다.
- 처음에는 복잡한 alert보다 dashboard 확인을 목표로 한다.
- k3s 내부에 Prometheus/Grafana를 올리는 방법도 가능하지만, 이번 프로젝트에서는 모니터링 역할 분리를 보여주기 위해 별도 VM을 사용한다.
