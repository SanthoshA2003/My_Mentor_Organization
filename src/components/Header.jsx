import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, HelpCircle, LogOut, User as UserIcon, ChevronDown, Briefcase, Users as UsersIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ROLE_LABELS = {
  org_admin: "Organization Admin", hr_admin: "HR Admin", recruiter: "Recruiter",
  hiring_manager: "Hiring Manager", interviewer: "Interviewer", viewer: "Viewer / Management",
};

export function Header({ collapsed }) {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const timer = useRef();

  const loadNotifs = async () => {
    try { const { data } = await api.get("/notifications"); setNotifs(data); } catch (e) {}
  };
  useEffect(() => { loadNotifs(); }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const onSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.length < 2) { setResults(null); setSearchOpen(false); return; }
    timer.current = setTimeout(async () => {
      try { const { data } = await api.get(`/search?q=${encodeURIComponent(val)}`); setResults(data); setSearchOpen(true); } catch (e) {}
    }, 250);
  };

  const markRead = async (n) => {
    await api.post(`/notifications/${n.id}/read`);
    loadNotifs();
    if (n.link) navigate(n.link);
  };

  const initials = (user?.name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <header
      className={cn("fixed top-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 md:px-6 gap-4 transition-all duration-300", collapsed ? "left-16" : "left-64")}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-display font-bold text-[#0a2540] truncate hidden sm:block">{org?.name || "Organization"}</span>
      </div>

      <div className="flex-1 max-w-md relative">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                data-testid="global-search-input"
                value={q}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search jobs, candidates, users..."
                className="pl-9 h-9 bg-slate-50 border-slate-200 focus-visible:ring-[#1e5bff]"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[380px] p-0" data-testid="global-search-results">
            <div className="max-h-96 overflow-y-auto">
              {results && (results.jobs.length + results.candidates.length + results.users.length === 0) && (
                <div className="p-4 text-sm text-slate-500">No results found.</div>
              )}
              {results?.jobs?.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-bold uppercase text-slate-400">Jobs</div>
                  {results.jobs.map((j) => (
                    <button key={j.id} onClick={() => { navigate(`/jobs/${j.id}`); setSearchOpen(false); }} className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-slate-50 text-left text-sm">
                      <Briefcase className="h-4 w-4 text-[#1e5bff]" /> {j.title} — {j.location}
                    </button>
                  ))}
                </div>
              )}
              {results?.candidates?.length > 0 && (
                <div className="p-2 border-t">
                  <div className="px-2 py-1 text-xs font-bold uppercase text-slate-400">Candidates</div>
                  {results.candidates.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700">
                      <UserIcon className="h-4 w-4 text-teal-500" /> {c.name} — {c.current_role}
                    </div>
                  ))}
                </div>
              )}
              {results?.users?.length > 0 && (
                <div className="p-2 border-t">
                  <div className="px-2 py-1 text-xs font-bold uppercase text-slate-400">Users</div>
                  {results.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700">
                      <UsersIcon className="h-4 w-4 text-emerald-500" /> {u.name} — {u.email}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-testid="notifications-btn" className="relative h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors duration-200">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-[#1e5bff] text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              <button data-testid="mark-all-read-btn" onClick={async () => { await api.post("/notifications/read-all"); loadNotifs(); }} className="text-xs text-[#1e5bff] hover:underline">Mark all read</button>
            </div>
            <DropdownMenuSeparator />
            {notifs.length === 0 && <div className="p-4 text-sm text-slate-500">No notifications.</div>}
            {notifs.map((n) => (
              <DropdownMenuItem key={n.id} data-testid={`notif-${n.id}`} onClick={() => markRead(n)} className="flex flex-col items-start gap-0.5 py-2 cursor-pointer">
                <span className={cn("text-sm", !n.read && "font-semibold text-[#0a2540]")}>{n.title}</span>
                <span className="text-xs text-slate-500">{n.body}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button data-testid="help-btn" className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors duration-200">
          <HelpCircle className="h-5 w-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-testid="profile-menu-btn" className="flex items-center gap-2 pl-2 pr-1 h-10 rounded-lg hover:bg-slate-100 transition-colors duration-200">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-[#1e5bff] text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium text-[#0a2540] leading-tight">{user?.name}</div>
                <div className="text-[11px] text-slate-500 leading-tight">{ROLE_LABELS[user?.role]}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="profile-account-btn" onClick={() => navigate("/settings?tab=account")}>
              <UserIcon className="h-4 w-4 mr-2" /> My Account
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="logout-btn" onClick={logout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
