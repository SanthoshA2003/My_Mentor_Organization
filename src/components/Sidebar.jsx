import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  ChevronLeft,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LOGO_URL } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/users",
    label: "Users",
    icon: Users,
  },
  {
    to: "/jobs",
    label: "Jobs",
    icon: Briefcase,
  },
  {
    to: "/interviews",
    label: "Interviews",
    icon: CalendarClock,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();

  console.log("Sidebar user:", user);
  console.log("Sidebar role:", user?.role);
  console.log("Sidebar permissions:", user?.permissions);

  return (
    <aside
      data-testid="app-sidebar"
      className={cn(
        "fixed left-0 top-0 h-full bg-[#0a2540] text-white z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-white/10",
          collapsed
            ? "justify-center px-2"
            : "px-5 gap-2"
        )}
      >
        <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0">
          <img
            src={LOGO_URL}
            alt="MyMentor"
            className="h-7 w-7 object-contain"
          />
        </div>

        {!collapsed && (
          <span className="font-display font-extrabold text-base tracking-tight">
            MyMentor
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            data-testid={`nav-${n.label.toLowerCase()}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-[#1e5bff] text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-0"
              )
            }
          >
            <n.icon className="h-5 w-5 shrink-0" />

            {!collapsed && <span>{n.label}</span>}
          </NavLink>
        ))}

        {/* Audit Log */}
        <NavLink
          to="/audit"
          data-testid="nav-audit"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
              isActive
                ? "bg-[#1e5bff] text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
              collapsed && "justify-center px-0"
            )
          }
        >
          <ShieldCheck className="h-5 w-5 shrink-0" />

          {!collapsed && <span>Audit Log</span>}
        </NavLink>
      </nav>

      {/* Collapse */}
      <button
        data-testid="sidebar-collapse-btn"
        onClick={onToggle}
        className="h-12 border-t border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 transition-colors duration-200"
      >
        <ChevronLeft
          className={cn(
            "h-5 w-5 transition-transform duration-300",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}