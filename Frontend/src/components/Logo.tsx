import { Link } from "react-router-dom";
import { assets, brand } from "../assets";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link to="/" className="logo" aria-label={`${brand.ko} 홈`}>
      <img src={assets.logoMark} alt="" />
      {!compact && (
        <span>
          <strong>{brand.ko}</strong>
          <em>{brand.en}</em>
        </span>
      )}
    </Link>
  );
}

