# CI/CD 및 간단 로드밸런싱 테스트 계획

작성일: 2026년 6월 13일  
작성자: rb  
목적: GitHub Actions 기반 Docker 이미지 자동 빌드/push와 k3s 환경에서 최소 부하 테스트 절차를 정리한다.

---

## 1. 현재 상태

팀원이 작성한 k3s manifest를 `origin/develop`에서 가져와 `ruby-0613` 브랜치에 병합했다.

현재 manifest 위치:

```txt
k3s/backend-deployment.yaml
k3s/frontend-deployment.yaml
k3s/ingress.yaml
k3s/mariadb.yaml
```

현재 Deployment replica 수:

```txt
frontend: 1
backend: 1
mariadb: 1
```

현재 이미지:

```txt
rubyjeenkim/dragon-frontend:latest
rubyjeenkim/dragon-backend:latest
```

이미지는 `linux/amd64`, `linux/arm64` 멀티 아키텍처로 빌드/push하는 방향으로 정리했다.

---

## 2. CI/CD 구축 계획

### 목표

GitHub Actions를 사용해 코드 변경 시 Frontend/Backend 빌드 확인과 Docker Hub 이미지 push를 자동화한다.

### 자동화 범위

`.github/workflows/docker-images.yml`에서 아래 작업을 수행한다.

- Frontend dependency 설치
- Frontend production build
- Backend dependency 설치
- Docker Hub 로그인
- Frontend Docker image 멀티 아키텍처 build/push
- Backend Docker image 멀티 아키텍처 build/push

빌드 플랫폼:

```txt
linux/amd64
linux/arm64
```

### 필요한 GitHub Secrets

GitHub repository 설정에서 아래 secret을 등록한다.

```txt
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```

경로:

```txt
GitHub Repository -> Settings -> Secrets and variables -> Actions
```

### 배포 반영 방식

현재는 Docker Hub 이미지 push까지만 GitHub Actions로 자동화한다.

k3s VM이 GitHub Actions runner에서 직접 접근 가능한 public 환경이 아니므로,
실제 k3s 반영은 VM에서 수동으로 진행한다.

```bash
sudo kubectl rollout restart deployment/frontend -n dragon-univ
sudo kubectl rollout restart deployment/backend -n dragon-univ
sudo kubectl get pods -n dragon-univ -w
```

처음 배포라면:

```bash
sudo kubectl apply -f k3s/
sudo kubectl get pods -n dragon-univ -w
```

---

## 3. 간단 로드밸런싱 테스트 계획

### 목표

VM 1대씩 사용하는 현재 실습 환경을 유지하면서,
Ingress/Service가 여러 Backend Pod로 요청을 분산하는지 간단히 확인한다.

정확한 의미의 5,000명 동시 접속 재현은 별도 장비와 모니터링 구성이 필요하다.
이번 테스트는 최소 구성으로 아래를 확인하는 데 목적을 둔다.

- Backend Pod를 2개 이상으로 늘릴 수 있는지
- Service가 여러 Backend Pod로 트래픽을 보낼 수 있는지
- 짧은 부하 상황에서 API가 응답하는지
- Pod crash 또는 restart가 발생하지 않는지

### 사전 조건

Backend health check API가 동작해야 한다.

```bash
curl http://sugang.drg/api/health
```

또는 VM 내부에서 Service로 직접 확인:

```bash
sudo kubectl get svc -n dragon-univ
```

### Backend replica 증가

현재 `backend`는 replica 1개다.
로드밸런싱을 확인하려면 최소 2개 이상으로 늘린다.

```bash
sudo kubectl scale deployment/backend --replicas=2 -n dragon-univ
sudo kubectl get pods -n dragon-univ -o wide
```

테스트 후 원복:

```bash
sudo kubectl scale deployment/backend --replicas=1 -n dragon-univ
```

### 부하 테스트 도구

가장 단순한 선택지는 `hey` 또는 `ab`다.

Ubuntu에서 `ab` 설치:

```bash
sudo apt update
sudo apt install -y apache2-utils
```

간단 테스트:

```bash
ab -n 5000 -c 100 http://sugang.drg/api/health
```

의미:

```txt
-n 5000  총 요청 5,000번
-c 100   동시 요청 100개
```

동시 요청 수는 한 번에 크게 올리지 말고 단계적으로 올린다.

```bash
ab -n 1000 -c 50 http://sugang.drg/api/health
ab -n 3000 -c 100 http://sugang.drg/api/health
ab -n 5000 -c 200 http://sugang.drg/api/health
```

### 관찰 명령

테스트 중 Pod 상태 확인:

```bash
sudo kubectl get pods -n dragon-univ -w
```

Pod restart 확인:

```bash
sudo kubectl get pods -n dragon-univ
```

Backend 로그 확인:

```bash
sudo kubectl logs deployment/backend -n dragon-univ --tail=100
```

Service endpoint 확인:

```bash
sudo kubectl get endpoints backend -n dragon-univ
```

replica를 2개로 늘렸다면 endpoint IP가 2개 이상 보여야 한다.

---

## 4. 최소 테스트 성공 기준

아래 조건을 만족하면 현재 단계의 간단 테스트는 성공으로 본다.

- `backend` Pod 2개가 Running 상태
- `backend` Service endpoint가 2개 이상 표시됨
- `ab -n 5000 -c 100` 요청이 완료됨
- 테스트 중 Pod restart가 증가하지 않음
- API 응답 실패율이 과도하게 높지 않음

---

## 5. 주의 사항

현재 환경에서 `-c 5000`처럼 동시 요청 5,000개를 바로 주는 것은 권장하지 않는다.
VM CPU, 메모리, 네트워크, DB connection 한계 때문에 실제 서비스 한계보다 테스트 환경이 먼저 병목이 될 수 있다.

수업 또는 시연 목적이라면 아래 방식이 현실적이다.

```txt
replicas=2
총 요청 5,000
동시 요청 50~200
Pod 상태와 응답률 확인
```

더 정확한 성능 테스트를 하려면 추후 아래 구성이 필요하다.

- 별도 부하 발생 장비
- k6 또는 Locust 시나리오
- Prometheus/Grafana 모니터링
- CPU/Memory request, limit 설정
- HPA 적용
- DB connection pool 튜닝
