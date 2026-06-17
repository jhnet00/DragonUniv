# CI/CD 및 간단 로드밸런싱 테스트 계획

작성일: 2026년 6월 13일  
작성자: rb  
목적: GitHub Actions, Jenkins, Terraform을 프로젝트에 단계적으로 붙이고 k3s 환경에서 최소 부하 테스트 절차를 정리한다.

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

GitHub Actions와 Jenkins의 역할을 분리해서 CI/CD 흐름을 구성한다.

```txt
GitHub Actions: 가벼운 CI 및 Docker image build/push 기준선
Jenkins: 실제 배포 파이프라인 실습
Terraform: 인프라 구성 기록 및 확장 설계
```

최종 목표 흐름:

```txt
GitHub push
-> GitHub Actions CI 확인
-> Jenkins pipeline 실행
-> Docker image build/push
-> k3s rollout restart 또는 kubectl apply
-> sugang.drg 접속 확인
```

단, 현재 실습 환경에서는 GitHub Actions workflow가 먼저 Docker Hub push까지 수행하도록 구성되어 있다.
Jenkins를 붙이면 Docker build/push 책임을 Jenkins로 옮기거나, GitHub Actions와 Jenkins를 단계별로 나눌 수 있다.

---

## 3. GitHub Actions 계획

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

## 4. Jenkins 구축 계획

### 목표

Jenkins를 사용해 실제 운영형 CI/CD 파이프라인 흐름을 실습한다.

추천 역할:

```txt
GitHub Actions: PR/build 확인
Jenkins: Docker build/push + k3s 배포 실행
```

### Jenkins 설치 위치

현재 VM 1대씩 사용하는 구성을 유지한다면 Jenkins는 아래 중 하나로 구성한다.

| 방식 | 장점 | 주의점 |
|------|------|--------|
| k3s VM에 직접 설치 | k3s 접근이 쉬움 | VM 자원 부족 가능 |
| 별도 VM에 설치 | 역할 분리 명확 | VM 추가 필요 |
| Docker 컨테이너로 실행 | 설치/삭제 쉬움 | Docker socket 권한 주의 |

최소 실습 기준으로는 k3s VM 또는 별도 실습 VM에 Jenkins를 설치하고,
Jenkins에서 `kubectl`로 k3s에 접근하는 방식을 사용한다.

### Jenkins pipeline 단계

초안:

```txt
1. GitHub repository checkout
2. Frontend npm ci / npm run build
3. Backend npm ci
4. Docker Hub login
5. Docker image build/push
6. kubectl apply -f k3s/
7. kubectl rollout restart deployment/frontend -n dragon-univ
8. kubectl rollout restart deployment/backend -n dragon-univ
9. kubectl rollout status 확인
```

### Jenkins credentials

Jenkins에 아래 credential을 등록한다.

```txt
Docker Hub username/token
GitHub access token 또는 deploy key
kubeconfig 또는 SSH key
```

주의:

- Docker Hub password 대신 access token 사용
- kubeconfig를 저장할 경우 권한 노출 주의
- 가능하면 Jenkins 전용 Docker Hub token 사용

### Jenkinsfile 작성 방향

추후 repository root에 `Jenkinsfile`을 추가한다.

초기에는 단순한 scripted/ declarative pipeline으로 시작한다.

```txt
checkout
build
docker push
deploy
verify
```

멀티 아키텍처 이미지를 Jenkins에서 빌드하려면 Jenkins 서버에도 Docker buildx/QEMU 설정이 필요하다.
설정 부담을 줄이려면 첫 단계에서는 Jenkins가 `kubectl rollout restart`만 담당하고,
이미지 빌드/push는 GitHub Actions에 맡기는 방식도 가능하다.

---

## 5. Terraform 구축 계획

### 목표

Terraform을 사용해 인프라 구성을 코드로 표현하고,
프로젝트 발표에서 IaC 흐름을 설명할 수 있게 만든다.

현재 환경이 로컬 VM/k3s 중심이므로 처음부터 AWS 리소스를 실제 생성하기보다,
아래 순서로 진행한다.

### 1단계: Terraform 문서화

`docs/schedule` 또는 `infra/terraform`에 아래 내용을 정리한다.

```txt
관리 대상
- VM 또는 서버
- Docker Hub image
- k3s namespace
- k3s manifest
- Ingress host
- 추후 AWS 확장 시 VPC/EC2/Security Group
```

### 2단계: Terraform 스캐폴드

repository에 `infra/terraform/` 폴더를 만들고 기본 구조를 준비한다.

```txt
infra/terraform/
  main.tf
  variables.tf
  outputs.tf
  README.md
```

### 3단계: Kubernetes provider 검토

k3s kubeconfig를 사용해 Terraform Kubernetes provider로 namespace, deployment, service 등을 관리할 수 있다.

다만 현재 manifest가 이미 YAML로 작성되어 있으므로,
초기에는 Terraform이 전체 manifest를 대체하기보다 구조 설계와 일부 리소스 관리 예시를 담당하게 한다.

### 4단계: AWS 확장 설계

프로젝트 발표용으로 아래 확장안을 정리한다.

```txt
AWS EC2: k3s node
AWS Security Group: HTTP/HTTPS/SSH 허용
Route 53: sugang.drg 또는 실제 도메인 연결
ECR 또는 Docker Hub: image registry
Terraform: EC2, Security Group, DNS, output 관리
```

---

## 6. VM 구성 계획

### 결론

CI/CD와 모니터링을 위해 VM을 반드시 새로 만들어야 하는 것은 아니다.

다만 Jenkins와 모니터링 도구는 CPU/메모리를 계속 사용하므로,
프로젝트 완성도와 안정성을 생각하면 역할별 VM을 분리하는 구성이 더 좋다.

### 최소 구성

오늘 바로 진행 가능한 최소 구성:

```txt
VM 1: k3s
- Frontend Pod
- Backend Pod
- MariaDB Pod
- Traefik Ingress

Mac 또는 로컬:
- GitHub Actions 설정
- Docker Desktop
- 문서 작업
```

이 구성에서는 Jenkins와 모니터링을 아직 설치하지 않고,
GitHub Actions로 이미지 build/push 후 k3s VM에서 수동 rollout을 실행한다.

장점:

- 추가 VM이 필요 없음
- 가장 빠르게 CI/CD 흐름을 확인 가능
- 현재 환경을 크게 건드리지 않음

단점:

- Jenkins 실습 범위가 부족함
- Prometheus/Grafana까지 올리면 k3s VM이 무거워질 수 있음

### 권장 구성

Jenkins와 모니터링까지 붙일 경우 권장 구성:

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

선택 VM 3: Monitoring
- Prometheus
- Grafana
```

VM을 2대까지만 쓸 수 있다면 Jenkins와 모니터링을 같은 VM에 두거나,
모니터링은 k3s 내부에 Helm chart로 설치한다.

### 현실적인 프로젝트 선택

현재 프로젝트에서는 아래 순서를 권장한다.

```txt
1. VM 추가 없이 GitHub Actions + k3s 수동 rollout 확인
2. Jenkins용 VM 1대 추가
3. Jenkins에서 k3s rollout 실행
4. 시간이 남으면 Prometheus/Grafana를 k3s 내부에 설치
5. Terraform은 infra/terraform 스캐폴드와 AWS 확장 설계부터 작성
```

즉, 당장 새 VM이 필수는 아니지만 Jenkins를 제대로 보여주려면 CI/CD VM 1대는 추가하는 것이 좋다.

---

## 7. 간단 로드밸런싱 테스트 계획

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

## 8. 최소 테스트 성공 기준

아래 조건을 만족하면 현재 단계의 간단 테스트는 성공으로 본다.

- `backend` Pod 2개가 Running 상태
- `backend` Service endpoint가 2개 이상 표시됨
- `ab -n 5000 -c 100` 요청이 완료됨
- 테스트 중 Pod restart가 증가하지 않음
- API 응답 실패율이 과도하게 높지 않음

---

## 9. 주의 사항

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
