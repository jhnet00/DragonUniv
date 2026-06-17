import { NavLink, Outlet } from "react-router-dom";
import { Activity, BookOpen, Gauge, Megaphone } from "lucide-react";
import { Logo } from "./Logo";

const menu = [
  { to: "/admin", label: "대시보드", icon: Gauge },
  { to: "/admin/monitoring", label: "시스템 모니터링", icon: Activity },
  { to: "/admin/courses", label: "강의 관리", icon: BookOpen },
  { to: "/admin/notice", label: "공지 관리", icon: Megaphone },
];

export function AdminShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />
        <div className="topbar-title">관리자페이지</div>
        <NavLink to="/admin-login" className="logout">로그아웃</NavLink>
      </header>
      <aside className="sidebar">
        <strong>관리자 메뉴</strong>
        <nav>
          {menu.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
