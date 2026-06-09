import { BookOpenCheck, CheckCircle2 } from "lucide-react";
import type { Course } from "../data/courses";

type CourseCardProps = {
  course: Course;
  busy?: boolean;
  onRegister?: (course: Course) => void;
};

const courseTypeLabels: Record<string, { label: string; tone: string }> = {
  Infrastructure: { label: "전공", tone: "good" },
  System: { label: "전공", tone: "good" },
  Network: { label: "전공", tone: "good" },
  DevOps: { label: "전공", tone: "good" },
  Kubernetes: { label: "전공", tone: "good" },
  Database: { label: "전공", tone: "good" },
  Security: { label: "전공", tone: "good" },
  Observability: { label: "교양", tone: "info" },
  "CI/CD": { label: "기타", tone: "warn" },
};

export function CourseCard({ course, busy = false, onRegister }: CourseCardProps) {
  const soldOut = course.seatsLeft === 0;
  const registered = Boolean(course.isRegistered);
  const type = courseTypeLabels[course.category] ?? { label: "기타", tone: "warn" };
  const tone = soldOut ? "danger" : type.tone;

  return (
    <article className="course-card">
      <div className="course-row">
        <span className="course-meta">{course.major} | {course.id}</span>
        <span className={`label-chip ${registered ? "good" : tone}`}>
          {registered ? <CheckCircle2 size={14} /> : <BookOpenCheck size={14} />}
          {registered ? "신청완료" : soldOut ? "마감" : type.label}
        </span>
      </div>
      <h3>{course.title}</h3>
      <p>{course.desc}</p>
      <div className="course-foot">
        <span>잔여좌석 {course.seatsLeft}/{course.seatsTotal}</span>
        <span>{course.credits}학점 · {course.instructor}</span>
      </div>
      <button disabled={soldOut || registered || busy} onClick={() => onRegister?.(course)}>
        {busy ? "처리중" : registered ? "신청완료" : soldOut ? "마감" : "강의 신청"}
      </button>
    </article>
  );
}
