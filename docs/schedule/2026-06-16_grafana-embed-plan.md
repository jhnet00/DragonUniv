# Grafana 패널 Admin 화면 Embed 계획

작성일: 2026년 6월 16일  
목적: `/admin/monitoring` 화면 안에서 Grafana 그래프를 직접 확인할 수 있도록 iframe embed 방식을 정리한다.

---

## 1. 목표

현재 `/admin/monitoring` 화면은 Grafana/Prometheus 바로가기와 VM 상태 정보를 보여준다.

다음 목표는 Grafana의 Node Exporter dashboard 패널을 iframe으로 불러와,
관리자 화면 안에서 k3s VM CPU/Memory 지표를 바로 확인하는 것이다.

```txt
/admin/monitoring
-> Grafana panel iframe
-> Prometheus data source
-> dragon-k3s node-exporter
```

---

## 2. 현재 적용한 프론트 구조

프론트 파일:

```txt
Frontend/src/pages/Monitoring.tsx
Frontend/src/styles/global.css
```

`Monitoring.tsx`에 `grafanaPanels` 배열을 추가했다.

```ts
const grafanaPanels = [
  {
    title: "k3s CPU / Load",
    src: "http://192.168.232.135:3000/d-solo/rYdddlPWk/node-exporter-full?orgId=1&refresh=10s&var-job=node-exporter&var-node=192.168.232.133:9100&panelId=20",
  },
  {
    title: "k3s Memory",
    src: "http://192.168.232.135:3000/d-solo/rYdddlPWk/node-exporter-full?orgId=1&refresh=10s&var-job=node-exporter&var-node=192.168.232.133:9100&panelId=16",
  },
];
```

주의:

- 위 `panelId`는 Node Exporter Full dashboard의 환경에 따라 다를 수 있다.
- 실제 Grafana에서 각 패널의 `Share -> Embed` URL을 복사해 `src`에 교체하는 것이 가장 정확하다.

---

## 3. Grafana 설정

Grafana는 기본적으로 iframe embedding을 막을 수 있다.
Monitoring VM에서 Grafana 설정을 수정한다.

```bash
sudo nano /etc/grafana/grafana.ini
```

아래 항목을 확인하거나 추가한다.

```ini
[security]
allow_embedding = true
```

로그인 없이 `/admin/monitoring` iframe에서 Grafana 패널을 바로 보려면 anonymous access도 필요할 수 있다.
실습/발표용 내부망에서만 사용한다.

```ini
[auth.anonymous]
enabled = true
org_role = Viewer
```

저장 후 Grafana 재시작:

```bash
sudo systemctl restart grafana-server
sudo systemctl status grafana-server
```

---

## 4. Grafana 패널 URL 가져오기

Grafana 접속:

```txt
http://192.168.232.135:3000
```

대시보드:

```txt
Node Exporter Full
Dashboard ID: 1860
job = node-exporter
instance = 192.168.232.133:9100
```

패널 embed URL 복사:

```txt
Panel title 클릭
-> Share
-> Embed
-> iframe src URL 복사
```

복사한 URL을 `Monitoring.tsx`의 `grafanaPanels[].src` 값으로 교체한다.

---

## 5. 확인 방법

프론트 dev server:

```bash
cd Frontend
npm run dev -- --host 127.0.0.1 --port 5174
```

브라우저:

```txt
http://127.0.0.1:5174/admin/monitoring
```

정상 기준:

- Grafana/Prometheus/Targets 버튼이 보임
- VM 카드가 보임
- Grafana iframe 패널 2개가 보임
- CPU/Memory 계열 그래프가 표시됨

---

## 6. 문제 해결

### iframe 영역이 비어 있거나 refused 표시

원인:

```txt
Grafana allow_embedding 미설정
Grafana login 필요
anonymous access 미설정
panel src URL 오류
```

해결:

```txt
allow_embedding = true
anonymous Viewer 임시 허용
Grafana Share -> Embed에서 URL 재복사
```

### No data

원인:

```txt
dashboard 변수 job/instance 불일치
panel URL의 var-job 또는 var-node 값 불일치
```

해결:

```txt
var-job=node-exporter
var-node=192.168.232.133:9100
```

### Prometheus는 UP인데 Grafana만 안 보임

확인:

```promql
up{instance="192.168.232.133:9100"}
```

값이 `1`이면 Prometheus 수집은 정상이다.
Grafana datasource와 dashboard 변수 설정을 다시 확인한다.

---

## 7. 후속 계획

1차는 Grafana iframe embed로 빠르게 화면 안 그래프를 완성한다.

이후 시간이 남으면 아래 방식으로 확장한다.

```txt
Backend monitoring proxy API
-> Prometheus query_range 호출
-> /admin/monitoring에서 직접 수치/미니 그래프 렌더링
```

직접 그래프 방식은 더 깔끔하지만 CORS, 인증, API 설계가 추가로 필요하므로,
현재 단계에서는 iframe embed를 우선 적용한다.
