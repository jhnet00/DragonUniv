# Grafana 패널 Admin 화면 Embed 계획

작성일: 2026년 6월 16일  
목적: `/admin/monitoring` 화면 안에서 Grafana 그래프를 직접 확인할 수 있도록 iframe embed 방식을 정리한다.

---

## 1. 목표

현재 `/admin/monitoring` 화면은 Grafana/Prometheus 바로가기와 VM 상태 정보를 보여준다.

다음 목표는 Grafana의 Node Exporter dashboard를 iframe으로 불러와,
관리자 화면 안에서 k3s VM CPU/Memory/Disk/Network 지표를 바로 확인하는 것이다.

```txt
/admin/monitoring
-> Grafana public dashboard iframe
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

처음에는 `d-solo` 개별 패널 iframe을 사용했지만,
시크릿 창과 프론트 iframe에서 `Forbidden`이 발생했다.

따라서 Grafana의 public dashboard external link를 사용하도록 변경했다.

```ts
const publicDashboardUrl = "http://192.168.232.135:3000/public-dashboards/68ec4f29b6414f1088b09e464361a688";
```

주의:

- Grafana에서 복사한 URL이 `localhost:3000`이면 프론트에서는 사용할 수 없다.
- 브라우저 기준 `localhost`는 사용자의 현재 PC이므로 `192.168.232.135:3000`으로 바꿔야 한다.
- public dashboard는 외부 공유 링크이므로 실습/발표용 내부망에서만 사용한다.

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

개별 `d-solo` 패널을 로그인 없이 보려면 anonymous access도 필요할 수 있다.
하지만 현재 환경에서는 anonymous 설정 후에도 dashboard 접근이 제한되어 public dashboard link를 사용했다.

```ini
[auth.anonymous]
enabled = true
org_name = Main Org.
org_role = Viewer
```

저장 후 Grafana 재시작:

```bash
sudo systemctl restart grafana-server
sudo systemctl status grafana-server
```

---

## 4. Public dashboard URL 가져오기

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

대시보드 public link 복사:

```txt
Dashboard 상단 Share
-> Public dashboard 또는 Share externally
-> Public dashboard 생성
-> External link 복사
```

복사한 URL 예시:

```txt
http://localhost:3000/public-dashboards/68ec4f29b6414f1088b09e464361a688
```

프론트에서는 아래처럼 VM IP로 바꿔 사용한다.

```txt
http://192.168.232.135:3000/public-dashboards/68ec4f29b6414f1088b09e464361a688
```

복사한 URL을 `Monitoring.tsx`의 `publicDashboardUrl` 값으로 교체한다.

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
- Grafana public dashboard iframe이 보임
- CPU/Memory/Disk/Network 계열 그래프가 표시됨

---

## 6. 문제 해결

### iframe 영역이 비어 있거나 refused 표시

원인:

```txt
Grafana allow_embedding 미설정
Grafana login 필요
anonymous access 미설정
panel src URL 오류
public dashboard 미활성화
```

해결:

```txt
allow_embedding = true
anonymous Viewer 임시 허용
Grafana Share -> Embed에서 URL 재복사
Public dashboard external link 사용
```

### d-solo 패널은 일반 창에서 열리는데 시크릿 창에서 Forbidden

원인:

```txt
일반 창은 Grafana 로그인 세션이 있어서 접근 가능
시크릿 창과 iframe은 로그인 세션이 없어 dashboard 권한 제한
```

해결:

```txt
개별 d-solo 패널 대신 public dashboard external link 사용
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
