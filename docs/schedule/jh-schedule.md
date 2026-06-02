# jh 작업 지시서

역할: System / Kubernetes Infrastructure Engineer  
담당 초점: Linux VM, k3s, Nginx Ingress, Service routing, Runtime operation, 학생/관리자 route 분리

## 5/27 수요일

### 목표

학생 페이지와 관리자 페이지의 URL 분리 방향을 정한다.

### 해야 할 일

1. 현재 학생/관리자 페이지가 섞여 있는 구조를 확인한다.
2. 학생 URL과 관리자 URL을 분리해서 정리한다.
3. 어떤 페이지가 학생용이고 어떤 페이지가 관리자용인지 나눈다.

### 진행 방법

1. 학생 페이지는 `/`, `/register`, `/classroom`, `/profile`, `/notices`로 둔다.
2. 관리자 페이지는 `/admin`, `/admin/courses`, `/admin/notice`, `/admin/monitoring`으로 둔다.
3. `App.tsx` 라우팅을 기준으로 현재 페이지와 목표 페이지를 비교한다.
4. 관리자 화면은 학생 sidebar와 다른 운영자 느낌의 layout을 따로 둘지 검토한다.

### 완료 기준

- 학생/관리자 URL 구조가 정리되어 있다.
- 어느 페이지를 분리해야 하는지 목록이 있다.

## 5/28 목요일

### 목표

k3s 실습 환경과 VM 네트워크 구조를 설계한다.

### 해야 할 일

1. VirtualBox VM 구성을 정한다.
2. Linux 배포판을 정한다.
3. VM 네트워크 방식을 정한다.
4. k3s 설치 방법을 조사한다.
5. 학생/관리자 route 분리 작업을 시작한다.

### 진행 방법

1. VM OS는 Rocky Linux 또는 Ubuntu 중 하나로 정한다.
2. 학습 편의성이 우선이면 Ubuntu, 프로젝트 문서와 맞추려면 Rocky Linux를 선택한다.
3. VirtualBox 네트워크는 NAT + Port Forwarding 또는 Bridged Adapter 중 하나로 정한다.
4. k3s 설치 명령을 조사한다.
5. `Frontend/src/App.tsx`에서 `/admin/*` route가 학생 route와 분리되어 있는지 확인한다.

### 완료 기준

- VM OS와 네트워크 방식이 정해져 있다.
- k3s 설치 절차가 메모되어 있다.
- `/admin` route 분리 방향이 정리되어 있다.

## 5/29 금요일

### 목표

Linux VM을 준비하고 k3s 설치를 테스트한다.

### 해야 할 일

1. VirtualBox에 Linux VM 생성
2. SSH 접속 가능 여부 확인
3. k3s 설치
4. kubectl 명령 확인
5. `/register`, `/admin` 라우팅 정리

### 진행 방법

1. VM에 CPU 2개, RAM 2~4GB 정도를 할당한다.
2. VM에 Linux를 설치한다.
3. 네트워크 IP를 확인한다.
4. host PC에서 SSH 접속을 테스트한다.
5. k3s 설치 후 `kubectl get nodes`를 실행한다.
6. 프론트에서는 학생 route와 admin route가 URL상 분리되어 보이는지 확인한다.

### 완료 기준

- `kubectl get nodes`에서 node가 Ready 상태다.
- `/register`와 `/admin`이 서로 다른 화면으로 이동한다.

## 5/30 토요일

### 목표

k3s에 간단한 nginx/app pod를 배포해 본다.

### 해야 할 일

1. nginx deployment 작성
2. service 작성
3. pod 상태 확인
4. 브라우저에서 접근 테스트
5. 학생/관리자 UI 보정

### 진행 방법

1. `nginx-deployment.yaml`을 만든다.
2. `kubectl apply -f nginx-deployment.yaml`을 실행한다.
3. `kubectl get pods`로 pod 상태를 확인한다.
4. `kubectl expose deployment nginx --type=NodePort --port=80` 또는 service yaml을 만든다.
5. VM IP와 NodePort로 접근한다.
6. 프론트 학생/관리자 화면에서 공통으로 어색한 부분을 같이 고친다.

### 완료 기준

- k3s 안에서 nginx pod가 뜬다.
- host 브라우저에서 VM의 서비스에 접근할 수 있다.

## 5/31 일요일

### 목표

k3s Service와 Ingress 개념을 실습한다.

### 해야 할 일

1. Deployment, Service 관계 이해
2. Ingress Controller 확인
3. Ingress route 작성
4. `/`와 `/admin` route를 어떻게 나눌지 설계

### 진행 방법

1. `kubectl get svc -A`로 k3s 기본 service를 확인한다.
2. k3s 기본 Traefik이 켜져 있는지 확인한다.
3. Traefik을 쓸지 Nginx Ingress를 따로 설치할지 결정한다.
4. Ingress rule 예시를 작성한다.
5. `/`는 frontend service, `/api`는 backend service로 보내는 구조를 설계한다.

### 완료 기준

- Service와 Ingress route 구조를 설명할 수 있다.
- `sugang.drg` route 설계 초안이 있다.

## 6/1 월요일

### 목표

Nginx reverse proxy 또는 Ingress route를 정리한다.

### 해야 할 일

1. 최종 route 구조 정리
2. `/api` proxy 규칙 정리
3. `/admin` route 처리 방식 정리
4. 로컬 hosts 설정 방식 정리

### 진행 방법

1. `sugang.drg`를 로컬에서 쓰려면 `/etc/hosts`에 VM IP를 매핑해야 한다.
2. `sugang.drg/`는 frontend로 보낸다.
3. `sugang.drg/register`도 frontend SPA route로 처리한다.
4. `sugang.drg/admin`도 frontend SPA route로 처리한다.
5. `sugang.drg/api`는 backend service로 proxy한다.
6. Ingress 또는 Nginx 설정 예시를 문서로 정리한다.

### 완료 기준

- route 설계가 문서로 있다.
- `/api`와 frontend route의 차이를 설명할 수 있다.

## 6/2 화요일

### 목표

k3s에 Frontend / Backend 배포 실습을 진행한다.

### 해야 할 일

1. Frontend deployment yaml 초안 작성
2. Backend deployment yaml 초안 작성
3. Service yaml 작성
4. 환경변수 주입 방식 정리
5. 1차 MVP 통합 테스트 참여

### 진행 방법

1. frontend image 이름을 rb와 맞춘다.
2. backend image 이름을 rb와 맞춘다.
3. backend에는 DB 접속 환경변수가 필요하므로 `env` 또는 `Secret` 방식을 검토한다.
4. MariaDB는 당장 외부 DB로 둘지 k3s 내부에 둘지 정한다.
5. `kubectl apply` 후 pod 상태를 확인한다.

### 완료 기준

- k3s 배포 yaml 초안이 있다.
- frontend/backend service 분리 구조가 있다.

## 6/3 수요일

### 목표

k3s manifest를 정리한다.

### 해야 할 일

1. `k8s/frontend-deployment.yaml` 작성
2. `k8s/backend-deployment.yaml` 작성
3. `k8s/frontend-service.yaml` 작성
4. `k8s/backend-service.yaml` 작성
5. `k8s/ingress.yaml` 작성

### 진행 방법

1. `metadata.name`은 명확하게 짓는다.
2. label은 `app: dragon-frontend`, `app: dragon-backend`처럼 통일한다.
3. service selector가 deployment label과 맞는지 확인한다.
4. ingress에서 `/api`는 backend service로 보낸다.
5. 나머지 path는 frontend service로 보낸다.

### 완료 기준

- k3s manifest 파일이 정리되어 있다.
- 각 파일의 역할을 설명할 수 있다.

## 6/4 목요일

### 목표

k3s rollout, restart, scale 시연을 준비한다.

### 해야 할 일

1. rollout restart 명령 확인
2. scale 명령 확인
3. pod 삭제 후 복구 확인
4. 장애 대응 시연 흐름 작성

### 진행 방법

1. `kubectl rollout restart deployment/<name>`을 테스트한다.
2. `kubectl scale deployment/<name> --replicas=2`를 테스트한다.
3. pod 하나를 삭제하고 자동 재생성되는지 확인한다.
4. 이 흐름을 발표 시나리오로 정리한다.

### 완료 기준

- k3s 운영 시연 명령이 정리되어 있다.
- 장애 복구 시연을 할 수 있다.

## 6/5 금요일

### 목표

장애 상황 pod 재시작/스케일링 시연을 준비한다.

### 해야 할 일

1. 정상 상태 캡처
2. pod 삭제 상황 캡처
3. 자동 복구 상황 캡처
4. scale out 상황 캡처

### 진행 방법

1. `kubectl get pods` 정상 상태를 캡처한다.
2. `kubectl delete pod <pod-name>`을 실행한다.
3. 새 pod가 생성되는 과정을 확인한다.
4. replicas를 2 이상으로 늘려 scale out 상태를 확인한다.
5. 사용자가 보는 서비스가 유지된다는 점을 설명한다.

### 완료 기준

- 장애 복구 캡처 자료가 있다.
- 발표에서 k3s 장점을 보여줄 수 있다.

## 6/6 토요일

### 목표

k3s manifest를 최종 정리한다.

### 해야 할 일

1. manifest 파일 이름 정리
2. 불필요한 테스트 yaml 제거
3. README에 apply 순서 작성
4. 환경변수/Secret 처리 방식 정리

### 진행 방법

1. manifest를 `k8s/` 폴더에 모은다.
2. 적용 순서를 README에 쓴다.
3. `kubectl apply -f k8s/`로 한 번에 적용 가능한지 확인한다.
4. 민감한 값은 문서에서 Secret로 처리한다고 적는다.

### 완료 기준

- k3s manifest가 발표/제출 가능한 상태다.

## 6/7 일요일

### 목표

k3s, ingress, service routing 운영 문서를 작성한다.

### 해야 할 일

1. k3s 설치 문서 작성
2. Service 설명 문서 작성
3. Ingress route 설명 문서 작성
4. 장애 대응 명령 정리

### 진행 방법

1. 실제 사용한 명령만 문서에 적는다.
2. `kubectl get nodes`, `kubectl get pods`, `kubectl get svc`, `kubectl get ingress` 설명을 적는다.
3. 사용자가 `sugang.drg/register`로 들어올 때 어떤 service로 가는지 설명한다.

### 완료 기준

- jh 담당 인프라 문서가 있다.

## 6/8 월요일

### 목표

최종 통합 테스트와 발표 리허설을 진행한다.

### 해야 할 일

1. k3s 배포 상태 확인
2. Ingress 접근 확인
3. Backend API 접근 확인
4. 장애 복구 시연 리허설
5. jh 발표 파트 정리

### 진행 방법

1. VM 부팅부터 서비스 확인까지 순서대로 진행한다.
2. 막히는 명령은 문서에 추가한다.
3. 발표에서 jh가 설명할 부분을 3분 분량으로 정리한다.

### 완료 기준

- jh 담당 영역을 끊기지 않고 설명할 수 있다.

## 6/9 화요일

### 목표

최종 보완 후 제출한다.

### 해야 할 일

1. k3s manifest 최종 확인
2. 운영 문서 최종 확인
3. 발표 캡처 확인
4. PR 내용 확인

### 진행 방법

1. 불필요한 테스트 yaml이 git에 올라가지 않았는지 확인한다.
2. 발표용 명령어가 실제로 동작하는지 마지막으로 확인한다.
3. PR 설명에 jh 담당 작업을 요약한다.

### 완료 기준

- jh 작업물이 GitHub에 정리되어 있다.
- 발표 준비가 끝나 있다.
