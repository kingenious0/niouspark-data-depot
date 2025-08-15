import { Signal } from "lucide-react";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Signal className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold font-headline text-foreground">
        Niouspark
      </span>
    </Link>
  );
};

export default Logo;