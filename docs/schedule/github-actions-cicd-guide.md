# GitHub Actions CI/CD 가이드

작성일: 2026년 6월 13일  
목적: Frontend/Backend 빌드 확인 및 Docker Hub 이미지 자동 push

## 1. 현재 자동화 범위

`.github/workflows/docker-images.yml` workflow가 아래 작업을 수행한다.

- Frontend `npm ci`
- Frontend `npm run build`
- Backend `npm ci`
- Docker Hub 로그인
- Frontend Docker image 멀티 아키텍처 빌드/push
- Backend Docker image 멀티 아키텍처 빌드/push

빌드 플랫폼:

```txt
linux/amd64
linux/arm64
```

따라서 팀원 `amd64` VM과 rb `arm64` VM에서 같은 `latest` 태그를 사용할 수 있다.

## 2. GitHub Secrets 설정

GitHub repository에서 아래 경로로 이동한다.

```txt
Settings -> Secrets and variables -> Actions -> New repository secret
```

필요한 secret:

| 이름 | 값 |
|------|----|
| `DOCKERHUB_USERNAME` | Docker Hub 사용자명 |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

Docker Hub password 대신 access token 사용을 권장한다.

## 3. Workflow 실행 조건

자동 실행:

- `develop` 브랜치 push
- `ruby-0613` 브랜치 push
- `develop` 대상 Pull Request

수동 실행:

```txt
GitHub -> Actions -> Build and Push Docker Images -> Run workflow
```

Pull Request에서는 Docker Hub push 없이 CI만 확인한다.

## 4. 생성되는 이미지 태그

Frontend:

```txt
rubyjeenkim/dragon-frontend:latest
rubyjeenkim/dragon-frontend:<git-commit-sha>
```

Backend:

```txt
rubyjeenkim/dragon-backend:latest
rubyjeenkim/dragon-backend:<git-commit-sha>
```

## 5. k3s 반영

현재 workflow는 Docker Hub push까지만 자동화한다.

k3s VM이 GitHub Actions runner에서 직접 접근 가능한 네트워크에 있지 않다면,
배포 반영은 VM에서 수동으로 진행한다.

```bash
sudo kubectl rollout restart deployment/frontend -n dragon-univ
sudo kubectl rollout restart deployment/backend -n dragon-univ
sudo kubectl get pods -n dragon-univ -w
```

manifest를 처음 적용하는 경우:

```bash
sudo kubectl apply -f k3s/
sudo kubectl get pods -n dragon-univ -w
```

## 6. 후속 자동 배포 옵션

완전 자동 배포까지 하려면 아래 중 하나가 필요하다.

- GitHub Actions에서 접근 가능한 public VM 또는 SSH 포트
- self-hosted GitHub Actions runner를 k3s VM 내부에 설치
- kubeconfig를 GitHub Secret으로 저장하고 API server를 외부에서 접근 가능하게 구성

현재 실습 환경에서는 보안과 네트워크 설정 부담을 줄이기 위해 Docker Hub push까지만 자동화하고,
k3s 반영은 VM에서 수동으로 하는 방식을 권장한다.
