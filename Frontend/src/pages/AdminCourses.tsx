import { useEffect, useState, type FormEvent } from "react";
import { Edit3, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { api, type AdminCoursePayload, type Major } from "../api";
import type { Course } from "../data/courses";

const emptyForm: AdminCoursePayload = {
  classCode: "",
  className: "",
  classDesc: "",
  seats: 30,
  credits: 3,
  category: "DevOps",
  instructor: "",
  majorId: 1,
};

export function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [form, setForm] = useState<AdminCoursePayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("관리자 강의 CRUD · MariaDB live data");

  async function loadAdminData() {
    setLoading(true);
    try {
      const [nextCourses, nextMajors] = await Promise.all([
        api.getAdminCourses(),
        api.getMajors(),
      ]);
      setCourses(nextCourses);
      setMajors(nextMajors);
      setMessage("MariaDB에서 강의 목록을 불러왔습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? `API 연결 실패 · ${error.message}` : "API 연결 실패");
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof AdminCoursePayload>(key: K, value: AdminCoursePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(course: Course) {
    if (!course.classId) return;
    setEditingId(course.classId);
    setForm({
      classCode: course.id,
      className: course.title,
      classDesc: course.desc,
      seats: course.seatsTotal,
      credits: course.credits,
      category: course.category,
      instructor: course.instructor,
      majorId: course.majorId ?? 1,
    });
    setMessage(`${course.title} 수정 모드입니다.`);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = editingId
        ? await api.updateAdminCourse(editingId, form)
        : await api.createAdminCourse(form);
      setMessage(result.message);
      resetForm();
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "강의 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(course: Course) {
    if (!course.classId) return;
    const confirmed = window.confirm(`${course.title} 강의를 삭제할까요? 신청 내역도 함께 삭제됩니다.`);
    if (!confirmed) return;
    setSaving(true);
    try {
      const result = await api.deleteAdminCourse(course.classId);
      setMessage(result.message);
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "강의 삭제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  return (
    <section className="page-stack">
      <div className="page-head compact">
        <div><p className="eyebrow">Admin</p><h1>강의 관리</h1></div>
        <button className="primary-btn" onClick={() => void loadAdminData()} disabled={loading}>
          <RefreshCw size={18} /> 새로고침
        </button>
      </div>

      <form className="admin-course-form" onSubmit={saveCourse}>
        <div className="form-title">
          <span>{editingId ? <Edit3 size={18} /> : <Plus size={18} />}{editingId ? "강의 수정" : "강의 추가"}</span>
          <em>{message}</em>
        </div>
        <div className="form-grid">
          <label>강의ID<input value={form.classCode} onChange={(event) => updateForm("classCode", event.target.value)} placeholder="CLOUD-401" required /></label>
          <label>강의명<input value={form.className} onChange={(event) => updateForm("className", event.target.value)} placeholder="클라우드 운영 자동화" required /></label>
          <label>전공
            <select value={form.majorId} onChange={(event) => updateForm("majorId", Number(event.target.value))}>
              {majors.map((major) => <option key={major.majorId} value={major.majorId}>{major.majorName}</option>)}
            </select>
          </label>
          <label>카테고리<input value={form.category} onChange={(event) => updateForm("category", event.target.value)} placeholder="DevOps" required /></label>
          <label>교수명<input value={form.instructor} onChange={(event) => updateForm("instructor", event.target.value)} placeholder="홍길동" required /></label>
          <label>좌석<input type="number" min="1" value={form.seats} onChange={(event) => updateForm("seats", Number(event.target.value))} required /></label>
          <label>학점<input type="number" min="1" value={form.credits} onChange={(event) => updateForm("credits", Number(event.target.value))} required /></label>
          <label className="wide">설명<input value={form.classDesc} onChange={(event) => updateForm("classDesc", event.target.value)} placeholder="강의 설명" required /></label>
        </div>
        <div className="form-actions">
          {editingId ? <button type="button" className="ghost-btn" onClick={resetForm}><X size={16} /> 취소</button> : null}
          <button className="primary-btn" disabled={saving}>{saving ? "저장중" : <><Save size={16} /> {editingId ? "수정 저장" : "강의 추가"}</>}</button>
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>강의ID</th><th>강의명</th><th>전공</th><th>좌석</th><th>상태</th><th></th></tr></thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.id}</td>
                <td>{course.title}</td>
                <td>{course.major}</td>
                <td>{course.seatsLeft}/{course.seatsTotal}</td>
                <td>{course.seatsLeft ? "Open" : "Closed"}</td>
                <td>
                  <button className="icon-btn" onClick={() => startEdit(course)}><Edit3 size={16} /></button>
                  <button className="icon-btn danger" onClick={() => void deleteCourse(course)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
