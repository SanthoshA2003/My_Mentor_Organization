import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Layout() {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-[#1e5bff] animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Header collapsed={collapsed} />
      <main className={cn("pt-16 min-h-screen transition-all duration-300", collapsed ? "pl-16" : "pl-64")}>
        <div className="p-5 md:p-8 max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
