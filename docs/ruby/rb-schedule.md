# rb 작업 지시서

역할: DevOps / Database / CI-CD Engineer  
담당 초점: MariaDB, Backend API, Docker, Jenkins, DB backup, 배포 자동화, Terraform/AWS 유관 설계

## 5/27 수요일

### 목표

DB 구조와 수강신청 핵심 테이블을 정리한다.

### 해야 할 일

1. `assets/db/DB-sample.txt`를 기준으로 필요한 테이블을 확정한다.
2. `majors`, `classes`, `students`, `stu_classes`, `admins` 관계를 정리한다.
3. 학생 1명 기준 테스트 계정을 정한다.
4. 수강신청 제한 조건을 정한다.

### 진행 방법

1. DB 문서에서 테이블 이름과 컬럼을 확인한다.
2. `students → stu_classes → classes → majors` 관계를 그림처럼 적는다.
3. `stu_classes`에는 같은 학생이 같은 강의를 중복 신청하지 못하도록 unique 조건을 둔다.
4. 학생당 최대 신청 과목 수를 우선 `3개`로 잡는다.
5. 학생당 최대 학점은 우선 `18학점`으로 잡는다.

### 완료 기준

- DB 테이블 목록이 확정되어 있다.
- 학생 테스트 계정이 정리되어 있다.
- 수강신청 제한 규칙이 정리되어 있다.

## 5/28 목요일

### 목표

MariaDB 스키마, seed, Backend API 초안을 만든다.

### 해야 할 일

1. `database/init/001_schema.sql` 작성
2. `database/init/002_seed.sql` 작성
3. `docker-compose.yml` 작성
4. `Backend` Express API scaffold 작성
5. 프론트 수강신청 버튼과 API 연결 시작

### 진행 방법

1. `database/init` 폴더를 만든다.
2. `001_schema.sql`에 테이블 생성 SQL을 작성한다.
3. `002_seed.sql`에 전공, 강의, 학생, 관리자 샘플 데이터를 넣는다.
4. `docker-compose.yml`에 MariaDB 컨테이너를 정의한다.
5. `Backend/package.json`을 만들고 `express`, `mysql2`, `cors`, `dotenv`를 설치한다.
6. `Backend/src/db.js`에서 MariaDB connection pool을 만든다.
7. `Backend/src/server.js`에서 `/api/health`, `/api/courses`, `/api/registrations`를 만든다.
8. 프론트 `Register.tsx`에서 API를 호출하도록 연결한다.

### 완료 기준

- SQL 스키마와 seed가 존재한다.
- Backend API 코드가 존재한다.
- 프론트가 API를 먼저 호출하고 실패 시 샘플 데이터로 fallback 한다.
- `npm run build`가 통과한다.

## 5/29 금요일

### 목표

수강신청 로직을 실제 DB 기준으로 안정화한다.

### 해야 할 일

1. 수강신청 API에 트랜잭션 적용
2. 잔여좌석 계산 로직 확인
3. 학생별 최대 과목 수 제한 적용
4. 학생별 최대 학점 제한 적용
5. 중복 신청 방지 확인

### 진행 방법

1. `POST /api/registrations`에서 DB transaction을 시작한다.
2. 신청 대상 강의를 `FOR UPDATE`로 잠근다.
3. 현재 신청 인원을 조회한다.
4. `registered_count >= seats`이면 409를 반환한다.
5. 학생의 현재 신청 과목 수를 조회한다.
6. `max_classes`를 초과하면 409를 반환한다.
7. 현재 신청 학점 합계를 조회한다.
8. 추가할 강의 학점과 합쳐 `max_credits`를 초과하면 409를 반환한다.
9. 조건을 모두 통과하면 `stu_classes`에 insert한다.
10. 중복 신청은 unique key로 방지한다.

### 완료 기준

- 마감된 강의는 신청되지 않는다.
- 같은 강의 중복 신청이 막힌다.
- 최대 과목 수와 최대 학점 제한이 동작한다.
- 실패 메시지가 프론트에 표시된다.

## 5/30 토요일

### 목표

로컬 개발 실행 환경을 문서화하고 Docker 기반 실행 흐름을 정리한다.

### 해야 할 일

1. `README.md` 실행 방법 보강
2. `.env.example` 정리
3. Docker MariaDB 실행 방법 정리
4. Backend 실행 방법 정리
5. Frontend 실행 방법 정리

### 진행 방법

1. 루트 README에 `docker compose up -d mariadb`를 적는다.
2. `Backend/.env.example`에 DB 접속 정보를 적는다.
3. `Frontend/.env.example`에 `VITE_API_BASE_URL`을 적는다.
4. Docker가 없을 때 VirtualBox MariaDB로 대체하는 방법도 적는다.
5. DB host만 바꾸면 Linux VM DB로 연결 가능하다고 문서화한다.

### 완료 기준

- 새 사람이 README만 보고 개발 환경을 이해할 수 있다.
- 로컬 Docker와 VirtualBox DB 방식이 둘 다 설명되어 있다.

## 5/31 일요일

### 목표

Jenkins CI/CD 파이프라인 초안을 준비한다.

### 해야 할 일

1. Jenkins 설치 방식 결정
2. Jenkins pipeline 단계 설계
3. Frontend build 단계 정의
4. Backend dependency install 단계 정의
5. Docker image build 계획 작성

### 진행 방법

1. Jenkins를 로컬, VM, 또는 Docker 중 어디에 둘지 정한다.
2. pipeline 단계를 아래처럼 나눈다.
   - Checkout
   - Install Frontend
   - Build Frontend
   - Install Backend
   - Backend syntax check
   - Docker build
   - Deploy
3. 아직 실제 배포가 어렵다면 `docs/ruby/jenkins-plan.md`로 설계 문서를 먼저 만든다.
4. 추후 `Jenkinsfile`로 옮길 수 있게 shell command 형태로 적는다.

### 완료 기준

- Jenkins pipeline 초안이 문서로 있다.
- 어떤 명령으로 build/test/deploy 할지 정리되어 있다.

## 6/1 월요일

### 목표

MariaDB 백업 전략과 cron 운영 방식을 정리한다.

### 해야 할 일

1. 테이블 단위 백업 대상 정리
2. `mysqldump` 명령 정리
3. 백업 스크립트 초안 작성
4. cron 시간표 작성
5. 복구 방법 정리

### 진행 방법

1. `assets/db/db-backup-notes.txt`를 다시 확인한다.
2. admin 관련 테이블과 student 관련 테이블을 나눈다.
3. `/scripts/backup_admin.sh`, `/scripts/backup_sugang.sh` 예시를 문서화한다.
4. cron은 부하 분산을 위해 시간대를 나눠 적는다.
5. 복구는 `mysql < backup.sql` 방식으로 적는다.

### 완료 기준

- DB 백업/복구 문서가 있다.
- 발표 때 “데이터 보존 전략”으로 설명할 수 있다.

## 6/2 화요일

### 목표

1차 MVP 통합 테스트를 진행한다.

### 해야 할 일

1. Backend API 전체 테스트
2. Frontend 수강신청 버튼 테스트
3. 신청 취소 테스트
4. 잔여좌석 변경 확인
5. 에러 메시지 확인

### 진행 방법

1. MariaDB를 실행한다.
2. Backend를 실행한다.
3. Frontend를 실행한다.
4. `/register`에서 강의를 신청한다.
5. DB의 `stu_classes`에 row가 추가되는지 확인한다.
6. 같은 강의를 다시 신청해 중복 에러가 뜨는지 확인한다.
7. 관심과목 리스트에서 취소 버튼을 눌러 row가 삭제되는지 확인한다.

### 완료 기준

- 프론트 버튼과 MariaDB가 실제로 연결되어 있다.
- 수강신청/취소가 정상 동작한다.

## 6/3 수요일

### 목표

배포 스크립트와 Docker image 전략을 정리한다.

### 해야 할 일

1. Frontend Dockerfile 설계
2. Backend Dockerfile 설계
3. image tag 규칙 정리
4. 배포 스크립트 초안 작성

### 진행 방법

1. image 이름을 정한다.
   - `dragon-univ-frontend`
   - `dragon-univ-backend`
2. tag 규칙을 정한다.
   - `latest`
   - git commit short hash
3. Jenkins에서 build할 명령을 정한다.
4. k3s rollout에 넘길 image 이름을 문서화한다.

### 완료 기준

- Docker image naming 규칙이 있다.
- Jenkins와 k3s가 연결될 흐름이 설명되어 있다.

## 6/4 목요일

### 목표

Terraform/AWS 유관 확장 설계 문서를 작성한다.

### 해야 할 일

1. 현재 VirtualBox/k3s 구조를 클라우드로 옮겼을 때의 대응 관계 정리
2. AWS 기준 가상 구조 작성
3. Terraform으로 관리할 리소스 목록 작성

### 진행 방법

1. VirtualBox VM은 AWS EC2에 대응한다고 적는다.
2. MariaDB는 RDS MariaDB에 대응한다고 적는다.
3. k3s는 EKS 또는 EC2 self-managed Kubernetes에 대응한다고 적는다.
4. Nginx/Ingress는 ALB Ingress Controller 또는 Nginx Ingress에 대응한다고 적는다.
5. Terraform 리소스 예시를 목록으로 쓴다.

### 완료 기준

- 실제 AWS를 쓰지 않아도 클라우드 확장 설계가 설명되어 있다.
- DevOps 포트폴리오에서 Terraform/AWS 유관 역량을 말할 수 있다.

## 6/5 금요일

### 목표

DB 백업/복구 시나리오를 발표 가능한 형태로 만든다.

### 해야 할 일

1. 백업 성공 시나리오 작성
2. 장애 발생 시나리오 작성
3. 복구 절차 작성
4. 발표용 캡처 준비

### 진행 방법

1. 정상 상태에서 `stu_classes`를 백업한다.
2. 테스트 row를 삭제하는 장애 상황을 가정한다.
3. 백업 SQL로 복구하는 절차를 쓴다.
4. “백업 전 / 장애 발생 / 복구 후” 흐름으로 설명한다.

### 완료 기준

- DB 장애 대응 이야기를 1분 안에 설명할 수 있다.
- 복구 절차가 문서로 있다.

## 6/6 토요일

### 목표

Jenkins pipeline을 최종 정리한다.

### 해야 할 일

1. Jenkinsfile 초안 작성
2. build 명령 확정
3. deploy 명령 확정
4. 실패 시 로그 확인 방법 정리

### 진행 방법

1. `pipeline { agent any ... }` 형태로 작성한다.
2. stage를 build/test/deploy로 나눈다.
3. Frontend build는 `npm run build`를 사용한다.
4. Backend 검증은 `node --check src/server.js`를 사용한다.
5. deploy는 k3s manifest apply 또는 rollout restart로 정리한다.

### 완료 기준

- Jenkins pipeline이 문서 또는 Jenkinsfile 형태로 정리되어 있다.

## 6/7 일요일

### 목표

운영 문서를 정리한다.

### 해야 할 일

1. CI/CD 문서 작성
2. DB backup 문서 작성
3. env 관리 문서 작성
4. 장애 대응 문서 작성

### 진행 방법

1. `.env.example` 기준으로 환경변수 목록을 설명한다.
2. 운영 환경에서는 `.env`를 git에 올리지 않는다고 적는다.
3. Jenkins credential 사용 계획을 적는다.
4. DB password, root password 관리 주의점을 적는다.

### 완료 기준

- 운영 관점 README 또는 docs 문서가 있다.

## 6/8 월요일

### 목표

최종 통합 테스트와 발표 리허설을 진행한다.

### 해야 할 일

1. DB 실행 확인
2. Backend 실행 확인
3. Frontend 실행 확인
4. Jenkins/k3s 설명 리허설
5. 장애/복구 시나리오 리허설

### 진행 방법

1. 처음부터 실행 순서를 따라가며 막히는 부분을 체크한다.
2. 막히는 명령은 README에 추가한다.
3. 발표에서 rb가 설명할 부분만 따로 3분 분량으로 정리한다.

### 완료 기준

- rb 담당 영역을 끊기지 않고 설명할 수 있다.

## 6/9 화요일

### 목표

최종 보완 후 제출한다.

### 해야 할 일

1. README 최종 확인
2. docs 최종 확인
3. GitHub branch / PR 확인
4. 발표용 캡처 확인

### 진행 방법

1. `git status`로 불필요한 파일이 올라가지 않았는지 확인한다.
2. `node_modules`, `dist`, `.env`가 제외되어 있는지 확인한다.
3. PR 설명에 rb 담당 작업을 요약한다.

### 완료 기준

- rb 작업물이 GitHub에 정리되어 있다.
- 발표 준비가 끝나 있다.
