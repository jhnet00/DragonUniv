import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <main className="not-found">
      <h1>404</h1>
      <p>요청한 포털 경로를 찾을 수 없습니다.</p>
      <Link to="/" className="primary-btn">홈으로</Link>
    </main>
  );
}
