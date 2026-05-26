export type Course = {
  id: string;
  major: string;
  title: string;
  desc: string;
  seatsLeft: number;
  seatsTotal: number;
  category: string;
  credits: number;
  instructor: string;
};

export const courses: Course[] = [
  { id: "INFRA-201", major: "컴퓨터공학과", title: "클라우드 인프라 설계", desc: "고가용성 웹 서비스를 위한 VPC, DNS, 로드밸런싱 설계", seatsLeft: 12, seatsTotal: 40, category: "Infrastructure", credits: 3, instructor: "한도윤" },
  { id: "SYS-210", major: "컴퓨터공학과", title: "리눅스 시스템 관리", desc: "Rocky Linux 운영, 권한, SELinux, 서비스 장애 대응", seatsLeft: 3, seatsTotal: 35, category: "System", credits: 3, instructor: "김서연" },
  { id: "NET-301", major: "전자공학과", title: "네트워크와 DNS 라우팅", desc: "DNS 레코드, Nginx reverse proxy, ingress routing", seatsLeft: 0, seatsTotal: 30, category: "Network", credits: 3, instructor: "윤태민" },
  { id: "DEVOPS-220", major: "컴퓨터공학과", title: "컨테이너와 Docker", desc: "이미지 빌드, 레지스트리, compose 기반 로컬 운영", seatsLeft: 27, seatsTotal: 50, category: "DevOps", credits: 3, instructor: "이지원" },
  { id: "K8S-310", major: "컴퓨터공학과", title: "Kubernetes 운영 실습", desc: "k3s 클러스터, 배포 전략, service discovery 실습", seatsLeft: 8, seatsTotal: 30, category: "Kubernetes", credits: 3, instructor: "박준호" },
  { id: "CICD-260", major: "경영정보시스템", title: "CI/CD 파이프라인", desc: "Jenkins, Git workflow, blue-green deployment", seatsLeft: 19, seatsTotal: 45, category: "CI/CD", credits: 3, instructor: "정하린" },
  { id: "DB-230", major: "경영정보시스템", title: "데이터베이스 운영", desc: "MariaDB 스키마, 테이블 단위 백업, 복구 자동화", seatsLeft: 5, seatsTotal: 40, category: "Database", credits: 3, instructor: "최민재" },
  { id: "OBS-240", major: "미디어학과", title: "모니터링과 Grafana", desc: "메트릭 수집, 대시보드, 알림 정책과 SLO", seatsLeft: 16, seatsTotal: 35, category: "Observability", credits: 3, instructor: "송아린" },
  { id: "SEC-250", major: "시각디자인학과", title: "보안과 인증 시스템", desc: "세션 보안, 관리자 권한 분리, 접근 로그 분석", seatsLeft: 22, seatsTotal: 40, category: "Security", credits: 3, instructor: "오현우" },
];

export const registeredCourseIds = ["INFRA-201", "CICD-260", "OBS-240"];

export const categories = ["All", ...Array.from(new Set(courses.map((course) => course.category)))];

