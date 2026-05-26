import { NavLink, Outlet } from "react-router-dom";
import { Activity, BookOpen, CalendarDays, Gauge, Megaphone, UserRound } from "lucide-react";
import { Logo } from "./Logo";

const menu = [
  { to: "/register", label: "수강신청", icon: BookOpen },
  { to: "/classroom", label: "나의 강의", icon: CalendarDays },
  { to: "/profile", label: "프로필", icon: UserRound },
  { to: "/notices", label: "공지사항", icon: Megaphone },
  { to: "/monitoring", label: "시스템 상태", icon: Activity },
  { to: "/admin", label: "관리자", icon: Gauge },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />
        <div className="topbar-title">수강신청시스템</div>
        <NavLink to="/login" className="logout">로그아웃</NavLink>
      </header>
      <aside className="sidebar">
        <strong>MY 강의실</strong>
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

