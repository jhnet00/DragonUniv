# Docker Hub 이미지 Pull 가이드

작성일: 2026년 6월 10일  
대상: jh / 정호  
목적: rb가 Docker Hub에 올린 Dragon University Frontend/Backend 이미지를 VM에서 받아오고, k3s manifest에 사용하는 방법을 정리한다.

## 1. 전제 조건

VM 안에 Ubuntu가 설치되어 있고, 터미널 또는 SSH로 접속 가능한 상태여야 한다.

확인:

```bash
hostname
whoami
```

k3s 상태 확인:

```bash
sudo kubectl get nodes
```

정상 예시:

```txt
NAME         STATUS   ROLES           VERSION
dragon-k3s  Ready    control-plane   v1.35.5+k3s1
```

## 2. Docker 설치

Ubuntu VM에 Docker가 없다면 아래 순서로 설치한다.

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable --now docker
```

설치 확인:

```bash
docker --version
sudo docker ps
```

`CONTAINER ID` 헤더가 보이면 Docker daemon이 정상 동작 중이다.

## 3. 일반 사용자에게 Docker 권한 주기

매번 `sudo docker`를 쓰기 싫다면 현재 사용자를 `docker` 그룹에 추가한다.

```bash
sudo usermod -aG docker $USER
```

적용하려면 로그아웃 후 다시 SSH 접속하거나, 아래 명령을 실행한다.

```bash
newgrp docker
```

확인:

```bash
docker ps
```

권한 에러 없이 실행되면 성공이다.

## 4. Docker Hub 로그인

Docker Hub public image만 pull할 경우 로그인이 필수는 아니지만, pull rate limit을 피하고 private image 가능성까지 대비하려면 로그인하는 것이 좋다.

```bash
docker login
```

입력:

```txt
Username: Docker Hub ID
Password: Docker Hub password 또는 access token
```

성공 예시:

```txt
Login Succeeded
```

로그아웃이 필요하면:

```bash
docker logout
```

## 5. Dragon University 이미지 Pull

rb가 Docker Hub에 올린 이미지:

```txt
rubyjeenkim/dragon-frontend:latest
rubyjeenkim/dragon-backend:latest
```

VM에서 pull:

```bash
docker pull rubyjeenkim/dragon-frontend:latest
docker pull rubyjeenkim/dragon-backend:latest
```

이미지 확인:

```bash
docker images | grep rubyjeenkim
```

정상 예시:

```txt
rubyjeenkim/dragon-frontend   latest   <IMAGE_ID>   ...
rubyjeenkim/dragon-backend    latest   <IMAGE_ID>   ...
```

## 6. k3s manifest에서 이미지 사용

Docker Hub 이미지를 직접 pull해서 쓸 경우, manifest의 `image` 값을 아래처럼 작성한다.

Frontend:

```yaml
image: rubyjeenkim/dragon-frontend:latest
imagePullPolicy: Always
```

Backend:

```yaml
image: rubyjeenkim/dragon-backend:latest
imagePullPolicy: Always
```

`imagePullPolicy: Always`를 사용하면 `latest` 태그가 갱신되었을 때 Pod 재생성 시 최신 이미지를 다시 받아온다.

## 7. Backend 환경변수

Backend Deployment에는 아래 환경변수가 필요하다.

같은 namespace `dragon-univ` 안에 Backend와 MariaDB를 함께 띄우는 것을 기준으로 한다.

```yaml
env:
  - name: PORT
    value: "4000"
  - name: DB_HOST
    value: "mariadb"
  - name: DB_PORT
    value: "3306"
  - name: DB_USER
    value: "dragon_app"
  - name: DB_PASSWORD
    value: "dragonpass"
  - name: DB_NAME
    value: "dragon_university"
  - name: STUDENT_NUMBER
    value: "20251119"
```

다른 namespace에서 Backend를 띄우면 `DB_HOST`를 전체 service DNS로 잡는다.

```txt
mariadb.dragon-univ.svc.cluster.local
```

## 8. 권장 namespace

현재 DB manifest는 `dragon-univ` namespace를 사용한다.

따라서 Frontend/Backend도 같은 namespace에 배포하는 것을 권장한다.

```yaml
metadata:
  namespace: dragon-univ
```

확인:

```bash
sudo kubectl get all -n dragon-univ
```

## 9. Ingress 라우팅 기준

Frontend는 `/api` 경로를 Backend API로 호출하도록 구성되어 있다.

Ingress 권장 라우팅:

```txt
/api  -> backend service:4000
/     -> frontend service:80
```

목표 URL:

```txt
sugang.drg/          -> Frontend
sugang.drg/register  -> Frontend SPA route
sugang.drg/classroom -> Frontend SPA route
sugang.drg/admin     -> Frontend SPA route
sugang.drg/api       -> Backend API
```

## 10. 배포 후 확인 명령

manifest 적용:

```bash
sudo kubectl apply -f k8s/
```

Pod 확인:

```bash
sudo kubectl get pods -n dragon-univ
```

Service 확인:

```bash
sudo kubectl get svc -n dragon-univ
```

Ingress 확인:

```bash
sudo kubectl get ingress -n dragon-univ
```

Backend health 확인:

```bash
sudo kubectl port-forward -n dragon-univ svc/backend 4000:4000
```

다른 터미널에서:

```bash
curl http://127.0.0.1:4000/api/health
```

정상 응답:

```json
{"ok":true,"db":"connected"}
```

Frontend 확인:

```bash
sudo kubectl port-forward -n dragon-univ svc/frontend 8080:80
```

브라우저:

```txt
http://127.0.0.1:8080
```

## 11. 자주 나는 문제

### pull은 되는데 Pod가 예전 이미지로 뜨는 경우

Pod를 재시작한다.

```bash
sudo kubectl rollout restart deployment/frontend -n dragon-univ
sudo kubectl rollout restart deployment/backend -n dragon-univ
```

### Docker Hub pull 실패

로그인 상태 확인:

```bash
docker login
```

이미지 이름 오타 확인:

```bash
docker pull rubyjeenkim/dragon-frontend:latest
docker pull rubyjeenkim/dragon-backend:latest
```

### Backend가 DB에 연결되지 않는 경우

MariaDB service 확인:

```bash
sudo kubectl get svc -n dragon-univ
```

Backend 로그 확인:

```bash
sudo kubectl logs -n dragon-univ deployment/backend
```

`DB_HOST=mariadb` 값과 namespace가 맞는지 확인한다.

## 12. 정호에게 전달할 짧은 메시지

```txt
Docker Hub에서 아래 이미지 pull해서 manifest에 써줘.

Frontend:
rubyjeenkim/dragon-frontend:latest

Backend:
rubyjeenkim/dragon-backend:latest

imagePullPolicy는 Always로 두면 되고,
Backend는 dragon-univ namespace에서 띄우면 DB_HOST=mariadb로 MariaDB 연결돼.

Ingress는 /api -> backend, / -> frontend 기준으로 잡으면 돼.
```
