import { Signal } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Signal className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold font-headline text-foreground">
        Niouspark
      </span>
    </div>
  );
};

export default Logo;
