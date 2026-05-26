import { Star } from "lucide-react";
import type { Course } from "../data/courses";

export function CourseCard({ course }: { course: Course }) {
  const soldOut = course.seatsLeft === 0;
  const ratio = course.seatsLeft / course.seatsTotal;
  const tone = soldOut ? "danger" : ratio < 0.25 ? "warn" : ratio < 0.55 ? "info" : "good";

  return (
    <article className="course-card">
      <div className="course-row">
        <span className="course-meta">{course.major} | {course.id}</span>
        <span className={`label-chip ${tone}`}><Star size={14} fill="currentColor" /> {course.category}</span>
      </div>
      <h3>{course.title}</h3>
      <p>{course.desc}</p>
      <div className="course-foot">
        <span>잔여좌석 {course.seatsLeft}/{course.seatsTotal}</span>
        <span>{course.credits}학점 · {course.instructor}</span>
      </div>
      <button disabled={soldOut}>{soldOut ? "마감" : "강의 신청"}</button>
    </article>
  );
}

