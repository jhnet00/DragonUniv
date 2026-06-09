import { Link } from "react-router-dom";
import { assets, brand } from "../assets";

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label={`${brand.ko} 홈`}>
      <img src={assets.logoMark} alt="" />
    </Link>
  );
}
