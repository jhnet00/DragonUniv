import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Course } from "../data/courses";
import { courses as fallbackCourses, registeredCourseIds } from "../data/courses";

export function Classroom() {
  const [mine, setMine] = useState<Course[]>(fallbackCourses.filter((course) => registeredCourseIds.includes(course.id)));
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("MariaDB 연동 시 신청 강의가 실시간으로 표시됩니다.");

  async function loadRegistrations() {
    try {
      const registrations = await api.getRegistrations();
      setMine(registrations);
      setMessage("MariaDB에서 나의 강의를 불러왔습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? `API offline · ${error.message}` : "API offline · fallback data");
    }
  }

  async function withdraw(course: Course) {
    if (!course.classId) {
      setMessage("샘플 데이터는 수강철회를 저장할 수 없습니다.");
      return;
    }
    setBusyId(course.classId);
    try {
      const result = await api.deleteRegistration(course.classId);
      setMessage(result.message);
      await loadRegistrations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "수강철회에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    void loadRegistrations();
  }, []);

  return (
    <section className="page-stack">
      <div className="page-head compact">
        <div><p className="eyebrow">MY 강의실</p><h1>나의 강의</h1></div>
        <Link to="/register" className="primary-btn">수강신청으로 이동</Link>
      </div>
      <div className="result-bar-modern">
        총 <strong>{mine.length}</strong>개의 강의를 신청했습니다. <span>{message}</span>
      </div>
      <div className="wide-grid">
        {mine.map((course) => (
          <article className="list-card course-list-item" key={course.id}>
            <Link to={`/courses/${course.id}`}>
              <strong>{course.title}</strong>
              <span>{course.major} · {course.id}</span>
              <p>{course.desc}</p>
            </Link>
            <div className="course-list-actions">
              <span>{course.credits}학점 · {course.instructor}</span>
              <button onClick={() => void withdraw(course)} disabled={busyId === course.classId}>
                {busyId === course.classId ? "처리중" : "수강철회"}
              </button>
            </div>
          </article>
        ))}
        {mine.length === 0 ? (
          <div className="glass-panel">
            <h2>신청한 강의가 없습니다.</h2>
            <p>수강신청 페이지에서 강의를 신청하면 이곳에 표시됩니다.</p>
            <Link to="/register" className="primary-btn">강의 신청하기</Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
