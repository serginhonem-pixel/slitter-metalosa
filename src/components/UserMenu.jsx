import React, { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Building2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function UserMenu() {
  const { userProfile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const company = userProfile?.companyName || userProfile?.email || "Empresa";
  const initials = company.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium hover:bg-zinc-800 transition"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <span className="hidden md:block max-w-[120px] truncate text-zinc-200">
          {company}
        </span>
        <ChevronDown className="w-3 h-3 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 py-1">
          <div className="px-3 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-300">
              <Building2 className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-xs font-semibold truncate">{company}</p>
                <p className="text-[11px] text-zinc-500 truncate">{userProfile?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition rounded-b-xl"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
