/* ============================================================
   Flow Orizon — primitivos de UI
   Ícones SVG inline, Avatar, Spinner, Portal, useClickOutside, Toaster.
   ============================================================ */
import { useEffect, useRef } from "react";

import S from "../store.js";

const ICONS = {
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  "eye-off":
    '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/><path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  trash:
    '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  pencil: '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  more:
    '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  palette:
    '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.55-.21-1.05-.55-1.42-.34-.36-.55-.86-.55-1.41 0-1.1.9-2 2-2h2.34A4.66 4.66 0 0 0 22 10.34 10 10 0 0 0 12 2z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
};

export function Icon({ name, size = 18, className = "", style = {}, strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }}
    />
  );
}

export function Avatar({ user, size = "md" }) {
  const initials = (user?.username || "?").slice(0, 2).toUpperCase();
  // Hue derivado do nome (não há id estável para usuários compartilhados).
  const seed = (user?.username || "")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hue = (seed * 37) % 360;
  return (
    <div
      className={"avatar" + (size === "sm" ? " avatar-sm" : "")}
      style={{ background: `hsl(${hue} 55% 52%)` }}
      title={user?.username}
    >
      {initials}
    </div>
  );
}

export function Spinner({ dark }) {
  return <span className={"spinner" + (dark ? " dark" : "")} />;
}

export function Portal({ children }) {
  return children;
}

// Fecha ao clicar fora ou apertar Escape.
export function useClickOutside(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return ref;
}

export function Toaster() {
  const { items } = S.useStore(S.toastStore);
  return (
    <Portal>
      <div className="toast-wrap">
        {items.map((t) => (
          <div key={t.id} className={"toast " + t.kind}>
            {t.kind === "success" && <Icon name="check" size={15} />}
            {t.kind === "error" && <Icon name="x" size={15} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Portal>
  );
}
