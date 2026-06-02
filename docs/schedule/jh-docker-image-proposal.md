# Docker 이미지 이름/태그 협의 제안

작성일: 2026-06-02  
작성자: jhnet00  
대상: rb

---

## 목적

k3s에 Frontend/Backend를 배포하려면 Docker 이미지가 필요함.  
이미지 이름과 태그를 jh/rb가 사전에 맞춰야 deployment yaml을 작성할 수 있음.  
아래 제안을 검토하고 맞춰주면 yaml 작성 진행할 것.

---

## 제안 이미지 이름

| 서비스 | 이미지 이름 | 포트 |
|--------|------------|------|
| Frontend | `dragon-frontend` | `80` |
| Backend | `dragon-backend` | `4000` |

---

## 제안 태그 전략

| 태그 | 용도 |
|------|------|
| `latest` | 로컬 실습 / 개발용 |
| `v1.0.0` | 1차 MVP 배포용 |

---

## 빌드 명령어 (rb가 빌드 후 공유)

```bash
# Frontend
docker build -t dragon-frontend:latest ./Frontend

# Backend
docker build -t dragon-backend:latest ./Backend
```

---

## k3s 로컬 이미지 로드 방식

k3s는 Docker 데몬을 직접 사용하지 않으므로 이미지를 아래 방식으로 로드해야 함:

```bash
# 이미지를 tar로 저장
docker save dragon-frontend:latest -o dragon-frontend.tar
docker save dragon-backend:latest -o dragon-backend.tar

# k3s에 이미지 import
sudo k3s ctr images import dragon-frontend.tar
sudo k3s ctr images import dragon-backend.tar
```

또는 Docker Hub에 push 후 yaml에서 pull하는 방식도 가능.

---

## 환경변수 주입 방식

### Backend

| 변수명 | 값 | 주입 방식 |
|--------|----|----------|
| `DB_HOST` | MariaDB 서비스 이름 | k8s Secret 또는 env |
| `DB_PORT` | `3306` | ConfigMap |
| `DB_USER` | `dragon_app` | k8s Secret |
| `DB_PASSWORD` | `dragonpass` | k8s Secret |
| `DB_NAME` | `dragon_university` | ConfigMap |
| `PORT` | `4000` | ConfigMap |

### Frontend

| 변수명 | 값 | 주입 방식 |
|--------|----|----------|
| `VITE_API_URL` | Backend 서비스 주소 | 빌드 시 `.env` |

---

## rb에게 확인 필요한 사항

1. 이미지 이름 `dragon-frontend` / `dragon-backend` 동의 여부
2. Docker Hub 사용할지 로컬 tar import 방식으로 할지
3. Frontend `.env`의 `VITE_API_URL` 값 결정 (예: `http://sugang.drg/api`)
4. Dockerfile 작성 담당 (rb 담당인지 확인)

---

## 다음 단계 (협의 완료 후)

- `k8s/frontend-deployment.yaml` 작성
- `k8s/backend-deployment.yaml` 작성
- `k8s/frontend-service.yaml` 작성
- `k8s/backend-service.yaml` 작성
- `k8s/ingress.yaml` 작성
