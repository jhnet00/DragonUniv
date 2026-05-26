USE dragon_university;

INSERT INTO majors (major_id, major_name) VALUES
  (1, '컴퓨터공학과'),
  (2, '기계공학과'),
  (3, '전자공학과'),
  (4, '경영학과'),
  (5, '미디어학과'),
  (6, '시각디자인학과')
ON DUPLICATE KEY UPDATE major_name = VALUES(major_name);

INSERT INTO classes (class_id, class_code, class_name, class_desc, seats, credits, category, instructor, major_id) VALUES
  (101, 'INFRA-201', '클라우드 인프라 설계', '고가용성 웹 서비스를 위한 VPC, DNS, 로드밸런싱 설계', 40, 3, 'Infrastructure', '한도윤', 1),
  (102, 'SYS-210', '리눅스 시스템 관리', 'Rocky Linux 운영, 권한, SELinux, 서비스 장애 대응', 35, 3, 'System', '김서연', 1),
  (103, 'NET-301', '네트워크와 DNS 라우팅', 'DNS 레코드, Nginx reverse proxy, ingress routing', 30, 3, 'Network', '윤태민', 3),
  (201, 'DEVOPS-220', '컨테이너와 Docker', '이미지 빌드, 레지스트리, compose 기반 로컬 운영', 50, 3, 'DevOps', '이지원', 1),
  (202, 'K8S-310', 'Kubernetes 운영 실습', 'k3s 클러스터, 배포 전략, service discovery 실습', 30, 3, 'Kubernetes', '박준호', 1),
  (203, 'CICD-260', 'CI/CD 파이프라인', 'Jenkins, Git workflow, blue-green deployment', 45, 3, 'CI/CD', '정하린', 4),
  (301, 'DB-230', '데이터베이스 운영', 'MariaDB 스키마, 테이블 단위 백업, 복구 자동화', 40, 3, 'Database', '최민재', 4),
  (302, 'OBS-240', '모니터링과 Grafana', '메트릭 수집, 대시보드, 알림 정책과 SLO', 35, 3, 'Observability', '송아린', 5),
  (303, 'SEC-250', '보안과 인증 시스템', '세션 보안, 관리자 권한 분리, 접근 로그 분석', 40, 3, 'Security', '오현우', 6)
ON DUPLICATE KEY UPDATE
  class_name = VALUES(class_name),
  class_desc = VALUES(class_desc),
  seats = VALUES(seats),
  credits = VALUES(credits),
  category = VALUES(category),
  instructor = VALUES(instructor),
  major_id = VALUES(major_id);

INSERT INTO students (stu_id, stu_name, stu_num, password, email, max_classes, max_credits, major_id) VALUES
  (9001, '박지후', '20251119', 'P@ssw0rd', 'jihoo.park@dragon.ac.kr', 3, 18, 4),
  (9002, '김드래곤', '20210001', 'P@ssw0rd', 'dragon.kim@dragon.ac.kr', 3, 18, 1)
ON DUPLICATE KEY UPDATE
  stu_name = VALUES(stu_name),
  password = VALUES(password),
  email = VALUES(email),
  max_classes = VALUES(max_classes),
  max_credits = VALUES(max_credits),
  major_id = VALUES(major_id);

INSERT INTO admins (admin_user, admin_pass) VALUES
  ('admin', 'P@ssw0rd')
ON DUPLICATE KEY UPDATE admin_pass = VALUES(admin_pass);

INSERT IGNORE INTO stu_classes (stu_id, class_id) VALUES
  (9001, 101),
  (9001, 203);
