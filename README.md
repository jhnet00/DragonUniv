# Dragon University Platform

명룡대학교 수강신청 플랫폼 프론트엔드와 MariaDB 기반 API 개발 환경입니다.

## Local Development

1. MariaDB 준비
   - Docker가 있으면 루트에서 `docker compose up -d mariadb`
   - VirtualBox/Linux 서버를 쓰면 `database/init`의 SQL을 MariaDB에 적용하고 `Backend/.env`의 DB_HOST를 VM IP로 변경

2. Backend 실행
   - `cd Backend`
   - `cp .env.example .env`
   - `npm install`
   - `npm run dev`

3. Frontend 실행
   - `cd Frontend`
   - `cp .env.example .env`
   - `npm install`
   - `npm run dev -- --port 5173`

## Demo Accounts

- Student: `20251119` / `P@ssw0rd`
- Admin: `admin` / `P@ssw0rd`

## API

- `GET /api/health`
- `GET /api/student`
- `GET /api/courses`
- `GET /api/registrations`
- `POST /api/registrations` with `{ "classId": 101 }`
- `DELETE /api/registrations/:classId`
