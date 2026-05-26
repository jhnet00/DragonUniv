import { useParams } from "react-router-dom";
import { notices } from "../data/notices";

export function NoticeDetail() {
  const { id } = useParams();
  const notice = notices.find((item) => item.id === id) ?? notices[0];
  return (
    <article className="detail-panel">
      <p className="eyebrow">{notice.tag} · {notice.date}</p>
      <h1>{notice.title}</h1>
      <p>{notice.body}</p>
    </article>
  );
}

