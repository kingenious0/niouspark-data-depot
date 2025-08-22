import Link from "next/link";
import LogoIcon from "./logo-icon";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <LogoIcon />
    </Link>
  );
};

export default Logo;