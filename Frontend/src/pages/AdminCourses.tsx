import { Edit3, Plus, Trash2 } from "lucide-react";
import { courses } from "../data/courses";

export function AdminCourses() {
  return (
    <section className="page-stack">
      <div className="page-head compact">
        <div><p className="eyebrow">Admin</p><h1>강의 관리</h1></div>
        <button className="primary-btn"><Plus size={18} /> Add course</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>강의ID</th><th>강의명</th><th>전공</th><th>좌석</th><th>상태</th><th></th></tr></thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.id}</td><td>{course.title}</td><td>{course.major}</td><td>{course.seatsLeft}/{course.seatsTotal}</td><td>{course.seatsLeft ? "Open" : "Closed"}</td>
                <td><button className="icon-btn"><Edit3 size={16} /></button><button className="icon-btn danger"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

