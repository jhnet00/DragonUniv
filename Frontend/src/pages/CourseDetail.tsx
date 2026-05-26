import { useParams } from "react-router-dom";
import { courses } from "../data/courses";

export function CourseDetail() {
  const { id } = useParams();
  const course = courses.find((item) => item.id === id) ?? courses[0];
  return (
    <section className="detail-panel">
      <p className="eyebrow">{course.major} | {course.id}</p>
      <h1>{course.title}</h1>
      <p>{course.desc}</p>
      <div className="detail-grid">
        <span>담당교수 <strong>{course.instructor}</strong></span>
        <span>학점 <strong>{course.credits}</strong></span>
        <span>잔여좌석 <strong>{course.seatsLeft}/{course.seatsTotal}</strong></span>
        <span>운영환경 <strong>k3s · MariaDB · Nginx</strong></span>
      </div>
    </section>
  );
}
