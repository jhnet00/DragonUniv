import { Link } from "react-router-dom";
import { courses, registeredCourseIds } from "../data/courses";

export function Classroom() {
  const mine = courses.filter((course) => registeredCourseIds.includes(course.id));
  return (
    <section className="page-stack">
      <div className="page-head compact"><div><p className="eyebrow">MY 강의실</p><h1>나의 강의</h1></div></div>
      <div className="wide-grid">
        {mine.map((course) => (
          <Link to={`/courses/${course.id}`} className="list-card" key={course.id}>
            <strong>{course.title}</strong>
            <span>{course.major} · {course.id}</span>
            <p>{course.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

