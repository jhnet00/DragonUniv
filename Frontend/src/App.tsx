import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
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
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login type="student" />} />
      <Route path="/admin-login" element={<Login type="admin" />} />
      <Route element={<AppShell />}>
        <Route path="/register" element={<Register />} />
        <Route path="/classroom" element={<Classroom />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/notices/:id" element={<NoticeDetail />} />
        <Route path="/monitoring" element={<Monitoring />} />
      </Route>
      <Route path="/main.html" element={<Navigate to="/register" replace />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

