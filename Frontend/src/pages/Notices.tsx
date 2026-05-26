import { Link } from "react-router-dom";
import { notices } from "../data/notices";

export function Notices() {
  return (
    <section className="page-stack">
      <div className="page-head compact"><div><p className="eyebrow">Notice Board</p><h1>공지사항</h1></div></div>
      <div className="wide-grid">
        {notices.map((notice) => (
          <Link to={`/notices/${notice.id}`} className="list-card" key={notice.id}>
            <span>{notice.tag} · {notice.date}</span>
            <strong>{notice.title}</strong>
            <p>{notice.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

