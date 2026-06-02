import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AdminShell } from "./components/AdminShell";
import { AdminCourses } from "./pages/AdminCourses";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Classroom } from "./pages/Classroom";
import { CourseDetail } from "./pages/CourseDetail";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Monitoring } from "./pages/Monitoring";
import { NotFound } from "./pages/NotFound";
import { NoticeDetail } from "./pages/NoticeDetail";
import { Notices } from "./pages/Notices";
import { Profile } from "./pages/Profile";
import { Register } from "./pages/Register";

export default function App() {
  return (
    <Routes>
      {/* 공통 */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login type="student" />} />
      <Route path="/admin-login" element={<Login type="admin" />} />

      {/* 학생 영역 */}
      <Route element={<AppShell />}>
        <Route path="/register" element={<Register />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/notices/:id" element={<NoticeDetail />} />
      </Route>

      {/* 관리자 영역 */}
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/notice" element={<Notices />} />
        <Route path="/admin/notices" element={<Notices />} />
        <Route path="/admin/monitoring" element={<Monitoring />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
