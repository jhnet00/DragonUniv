# rb 5/27 DB 구조 정리 완료 문서

작업일: 2026년 5월 27일 기준 정리  
담당: rb  
범위: MariaDB schema, 테스트 계정, 수강신청 제한 규칙 확정

## 1. DB 이름

프로젝트 DB 이름은 기존 `sama_university`가 아니라 명룡대학교 프로젝트에 맞춰 아래 이름을 사용한다.

```txt
dragon_university
```

## 2. 확정 테이블

| 테이블 | 역할 | 주요 컬럼 |
|---|---|---|
| `majors` | 전공 목록 | `major_id`, `major_name` |
| `classes` | 수강 가능 강의 목록 | `class_id`, `class_code`, `class_name`, `class_desc`, `seats`, `credits`, `category`, `instructor`, `major_id` |
| `students` | 학생 계정 및 기본 정보 | `stu_id`, `stu_name`, `stu_num`, `password`, `email`, `max_classes`, `max_credits`, `major_id` |
| `stu_classes` | 학생별 수강신청 내역 | `id`, `stu_id`, `class_id`, `created_at` |
| `admins` | 관리자 계정 | `id`, `admin_user`, `admin_pass` |

## 3. 테이블 관계

```txt
majors 1 ─── N classes
majors 1 ─── N students
students 1 ─── N stu_classes
classes 1 ─── N stu_classes
```

상세 관계:

- 하나의 전공은 여러 강의를 가진다.
- 하나의 전공은 여러 학생을 가진다.
- 하나의 학생은 여러 강의를 신청할 수 있다.
- 하나의 강의는 여러 학생에게 신청될 수 있다.
- 학생과 강의의 N:M 관계는 `stu_classes`로 연결한다.

## 4. 주요 제약 조건

### 전공

- `majors.major_id`는 primary key다.
- `majors.major_name`은 중복되지 않게 관리한다.

### 강의

- `classes.class_id`는 primary key다.
- `classes.class_code`는 프론트에 보여줄 강의 코드이며 unique로 관리한다.
- `classes.major_id`는 `majors.major_id`를 참조한다.
- 전공 삭제 또는 변경 시 강의도 cascade 처리한다.

### 학생

- `students.stu_id`는 primary key다.
- `students.stu_num`은 로그인 ID로 사용하며 unique로 관리한다.
- `students.major_id`는 `majors.major_id`를 참조한다.
- `max_classes`는 학생별 최대 신청 과목 수다.
- `max_credits`는 학생별 최대 신청 학점이다.

### 수강신청

- `stu_classes.id`는 primary key다.
- `stu_classes.stu_id`는 `students.stu_id`를 참조한다.
- `stu_classes.class_id`는 `classes.class_id`를 참조한다.
- `UNIQUE (stu_id, class_id)`로 같은 학생이 같은 강의를 중복 신청하지 못하게 한다.

## 5. 테스트 계정

### 학생 계정

| 항목 | 값 |
|---|---|
| 이름 | 박지후 |
| 학번 | `20251119` |
| 비밀번호 | `P@ssw0rd` |
| 전공 | 경영학과 |
| 최대 신청 과목 | 3개 |
| 최대 신청 학점 | 18학점 |

추가 시연용 계정:

| 항목 | 값 |
|---|---|
| 이름 | 김드래곤 |
| 학번 | `20210001` |
| 비밀번호 | `P@ssw0rd` |
| 전공 | 컴퓨터공학과 |
| 최대 신청 과목 | 3개 |
| 최대 신청 학점 | 18학점 |

### 관리자 계정

| 항목 | 값 |
|---|---|
| ID | `admin` |
| PW | `P@ssw0rd` |

## 6. 수강신청 제한 규칙

수강신청 API는 아래 순서로 검사한다.

1. 강의가 존재하는지 확인한다.
2. 강의 잔여좌석이 있는지 확인한다.
3. 학생이 이미 같은 강의를 신청했는지 확인한다.
4. 학생의 현재 신청 과목 수가 `max_classes` 미만인지 확인한다.
5. 학생의 현재 신청 학점 + 신청 대상 강의 학점이 `max_credits` 이하인지 확인한다.
6. 모든 조건을 통과하면 `stu_classes`에 신청 내역을 저장한다.

## 7. 동시성 처리 방향

수강신청은 트래픽이 몰리는 기능이므로 신청 저장 시 transaction을 사용한다.

처리 방향:

```txt
BEGIN
  SELECT target class FOR UPDATE
  check capacity
  check student limits
  INSERT stu_classes
COMMIT
```

실패 시:

```txt
ROLLBACK
```

## 8. seed 기준 초기 데이터

초기 강의는 DevOps / Infrastructure 포트폴리오 성격을 보여줄 수 있도록 아래 과목을 사용한다.

| 강의코드 | 강의명 | 카테고리 |
|---|---|---|
| `INFRA-201` | 클라우드 인프라 설계 | Infrastructure |
| `SYS-210` | 리눅스 시스템 관리 | System |
| `NET-301` | 네트워크와 DNS 라우팅 | Network |
| `DEVOPS-220` | 컨테이너와 Docker | DevOps |
| `K8S-310` | Kubernetes 운영 실습 | Kubernetes |
| `CICD-260` | CI/CD 파이프라인 | CI/CD |
| `DB-230` | 데이터베이스 운영 | Database |
| `OBS-240` | 모니터링과 Grafana | Observability |
| `SEC-250` | 보안과 인증 시스템 | Security |

## 9. 완료 체크

- [x] DB 테이블 목록 확정
- [x] 주요 컬럼 확정
- [x] 테이블 관계 확정
- [x] 학생 테스트 계정 확정
- [x] 관리자 테스트 계정 확정
- [x] 학생별 최대 신청 과목 수 확정
- [x] 학생별 최대 신청 학점 확정
- [x] 중복 신청 방지 방식 확정
- [x] 수강신청 트랜잭션 처리 방향 확정
