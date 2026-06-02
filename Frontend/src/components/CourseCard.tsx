import { CheckCircle2, CircleAlert, CircleGauge, CirclePause, CircleX } from "lucide-react";
import type { Course } from "../data/courses";

type CourseCardProps = {
  course: Course;
  busy?: boolean;
  onRegister?: (course: Course) => void;
};

export function CourseCard({ course, busy = false, onRegister }: CourseCardProps) {
  const soldOut = course.seatsLeft === 0;
  const registered = Boolean(course.isRegistered);
  const ratio = course.seatsLeft / course.seatsTotal;
  const availability = soldOut
    ? { tone: "danger", label: "마감", icon: CircleX }
    : ratio >= 0.6
      ? { tone: "good", label: "여유", icon: CircleGauge }
      : ratio >= 0.4
        ? { tone: "info", label: "보통", icon: CirclePause }
        : { tone: "warn", label: "임박", icon: CircleAlert };
  const AvailabilityIcon = availability.icon;

  return (
    <article className="course-card">
      <div className="course-row">
        <span className="course-meta">{course.major} | {course.id}</span>
        <span className={`label-chip ${registered ? "good" : availability.tone}`}>
          {registered ? <CheckCircle2 size={14} /> : <AvailabilityIcon size={14} />}
          {registered ? "신청완료" : availability.label}
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
