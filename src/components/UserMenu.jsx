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
        className="btn-quiet text-sm"
      >
        <div className="w-6 h-6 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <span className="hidden md:block max-w-[120px] truncate text-ink">
          {company}
        </span>
        <ChevronDown className="w-3 h-3 text-ink-faint" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-paper border border-divider z-50 py-1">
          <div className="px-3 py-2 border-b border-divider">
            <div className="flex items-center gap-2 text-ink-soft">
              <Building2 className="w-4 h-4 text-ink-faint" />
              <div>
                <p className="text-xs font-semibold truncate text-ink">{company}</p>
                <p className="text-[11px] text-ink-faint truncate">{userProfile?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-700 hover:bg-paper-2 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
