import { useMemo, useState } from "react";
import { Bookmark, ClipboardList, Search } from "lucide-react";
import { CourseCard } from "../components/CourseCard";
import { MetricCard } from "../components/MetricCard";
import { categories, courses, registeredCourseIds } from "../data/courses";

const courseTypes = ["교양과목", "전공과목", "교직과목", "IPP교과목"];

export function Register() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [courseType, setCourseType] = useState("전공과목");
  const [availableOnly, setAvailableOnly] = useState(false);
  const filtered = useMemo(() => courses.filter((course) => {
    const matchesQuery = `${course.title} ${course.major} ${course.id}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || course.category === category;
    const matchesSeats = !availableOnly || course.seatsLeft > 0;
    return matchesQuery && matchesCategory && matchesSeats;
  }), [query, category, availableOnly]);
  const wishCourses = courses.filter((course) => registeredCourseIds.includes(course.id));
  const wishCredits = wishCourses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <section className="page-stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">2025 Fall Semester</p>
          <h1>수강신청</h1>
        </div>
        <div className="status-grid">
          <MetricCard label="현재 접속자" value="12,482명" state="Queue stable" />
          <MetricCard label="Load Balancer" value="Active" />
          <MetricCard label="API Latency" value="42ms" />
          <MetricCard label="Ingress" value="Healthy" />
        </div>
      </div>
      <div className="register-tabs" aria-label="수강신청 메뉴">
        <button className="active"><Search size={16} /> 개설강좌 조회/신청</button>
        <button><ClipboardList size={16} /> 나의 수강신청 현황</button>
      </div>
      <div className="registration-console">
        <div className="console-header">
          <span><Search size={16} /> 개설강좌 조회/신청</span>
          <em>신청기간: <strong>2025.08.18 09:00 ~ 08.22 17:00</strong></em>
        </div>
        <div className="course-type-row">
          {courseTypes.map((type) => (
            <label key={type} className={courseType === type ? "active" : ""}>
              <input type="radio" name="course-type" value={type} checked={courseType === type} onChange={(event) => setCourseType(event.target.value)} />
              {type}
            </label>
          ))}
        </div>
        <div className="filter-bar compact">
          <label className="search-field"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="강의명, 전공명, 강의ID 검색" /></label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <label className="toggle"><input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} /> 잔여좌석만</label>
          <button className="lookup-btn">조회</button>
          <button className="reset-btn" onClick={() => { setQuery(""); setCategory("All"); setAvailableOnly(false); }}>초기화</button>
        </div>
        <div className="result-bar-modern">
          총 <strong>{filtered.length}</strong>건의 강좌가 조회되었습니다.
        </div>
      </div>
      <div className="course-grid">
        {filtered.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
      <div className="registration-console">
        <div className="console-header green">
          <span><Bookmark size={16} /> 관심과목 리스트</span>
          <em>관심신청학점: <strong>{wishCredits}</strong>학점 | 관심과목수: <strong>{wishCourses.length}</strong></em>
        </div>
        <div className="wish-summary">
          {wishCourses.map((course, index) => (
            <article key={course.id}>
              <span>{index + 1}</span>
              <strong>{course.title}</strong>
              <em>{course.id} · {course.credits}학점 · {course.instructor}</em>
            </article>
          ))}
          <button className="save-order-btn">순서저장</button>
        </div>
        <div className="console-notice">
          관심과목을 담았더라도 반드시 수강신청 기간에 최종 신청을 완료해야 합니다.
        </div>
      </div>
    </section>
  );
}
