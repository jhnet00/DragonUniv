import { LockKeyhole, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { assets, brand } from "../assets";
import { Logo } from "../components/Logo";

export function Login({ type }: { type: "student" | "admin" }) {
  const admin = type === "admin";

  return (
    <main className={`login-page ${admin ? "admin-mode" : ""}`} style={{ backgroundImage: `url(${admin ? assets.heroAlt : assets.hero})` }}>
      <header className="login-header">
        <Logo />
        <strong>{brand.ko} | {admin ? "관리자페이지" : "수강신청시스템"}</strong>
      </header>
      <section className="login-card">
        <p>{admin ? "관리자페이지" : "수강신청시스템"}</p>
        <h1>LOGIN</h1>
        <label>
          <span>{admin ? "ID" : "ID #학생번호"}</span>
          <div className="input-wrap"><UserRound size={18} /><input placeholder="아이디를 입력해주세요." /></div>
        </label>
        <label>
          <span>Password</span>
          <div className="input-wrap"><LockKeyhole size={18} /><input type="password" placeholder="비밀번호를 입력해주세요." /></div>
        </label>
        <Link to={admin ? "/admin" : "/register"} className="login-submit">로그인</Link>
        <a className="forgot" href="#">Forgot password?</a>
        <small>{admin ? "Admin access · infrastructure control plane" : `${brand.host} · secure session`}</small>
      </section>
    </main>
  );
}

