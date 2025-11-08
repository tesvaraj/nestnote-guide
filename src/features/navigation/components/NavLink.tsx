// 🧭 FRONTEND: Navigation link component
// Reusable navigation link with active state styling

import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}

export const NavLink = ({ to, icon: Icon, label, isActive }: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};
