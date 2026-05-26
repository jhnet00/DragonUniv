import { ShieldCheck } from "lucide-react";

export function Profile() {
  return (
    <section className="profile-layout">
      <article className="profile-card">
        <div className="avatar">박</div>
        <h1>박지후</h1>
        <p>20230004 · 경영학과</p>
        <dl>
          <div><dt>이메일</dt><dd>jihoo.park@dragon.ac.kr</dd></div>
          <div><dt>신청 학점</dt><dd>9</dd></div>
          <div><dt>최대 학점</dt><dd>18</dd></div>
        </dl>
      </article>
      <div className="page-stack">
        <article className="glass-panel"><h2>Registered course summary</h2><p>클라우드 인프라 설계, CI/CD 파이프라인, 모니터링과 Grafana</p></article>
        <article className="glass-panel"><h2><ShieldCheck size={20} /> Account security</h2><p>2FA optional · session expires in 23m · last password update 2025.07.21</p></article>
        <article className="glass-panel"><h2>Login history</h2><p>Seoul · Chrome · 2026.05.26 15:20 KST</p></article>
      </div>
    </section>
  );
}

