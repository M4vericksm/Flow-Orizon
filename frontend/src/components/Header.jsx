/* ============================================================
   Flow Orizon — Header (filtros, ocultar concluídas, tema, usuário)
   ============================================================ */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import S from "../store.js";
import { Avatar, Icon, useClickOutside } from "./ui.jsx";

const THEME_META = {
  classic: { label: "Clássico", sw: "#FAFAFA" },
  notebook: { label: "Caderno", sw: "#EFE6D2" },
  cork: { label: "Cortiça", sw: "#C49770" },
  night: { label: "Noite", sw: "#1A1A1A" },
};

function FilterPopover({ filters, setFilters, onClose }) {
  const ref = useClickOutside(onClose);
  const PRIOS = [
    ["low", "Baixa"],
    ["medium", "Média"],
    ["high", "Alta"],
  ];
  const toggleP = (p) =>
    setFilters((f) => ({
      ...f,
      priorities: f.priorities.includes(p)
        ? f.priorities.filter((x) => x !== p)
        : [...f.priorities, p],
    }));
  const active = filters.priorities.length || filters.status !== "all" || filters.sharedWithMe;
  return (
    <div className="popover on-surface" ref={ref} style={{ top: 44, right: 0, width: 244 }}>
      <div style={{ padding: "4px 8px 8px" }}>
        <div className="field-label">Prioridade</div>
        <div className="segmented" style={{ marginTop: 6 }}>
          {PRIOS.map(([v, lbl]) => (
            <button
              key={v}
              className={"seg" + (filters.priorities.includes(v) ? " active" : "")}
              style={{ padding: "6px 4px", fontSize: 12 }}
              onClick={() => toggleP(v)}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="field-label" style={{ marginTop: 14 }}>
          Status
        </div>
        <div className="segmented" style={{ marginTop: 6 }}>
          {[
            ["all", "Todas"],
            ["pending", "Pendentes"],
            ["done", "Concluídas"],
          ].map(([v, lbl]) => (
            <button
              key={v}
              className={"seg" + (filters.status === v ? " active" : "")}
              style={{ padding: "6px 4px", fontSize: 12 }}
              onClick={() => setFilters((f) => ({ ...f, status: v }))}
            >
              {lbl}
            </button>
          ))}
        </div>
        <label
          className="toggle-row"
          style={{ marginTop: 14, cursor: "pointer" }}
          onClick={() => setFilters((f) => ({ ...f, sharedWithMe: !f.sharedWithMe }))}
        >
          <div className="lbl" style={{ fontSize: 13 }}>
            Só compartilhadas comigo
          </div>
          <button type="button" className={"switch" + (filters.sharedWithMe ? " on" : "")} />
        </label>
        {active ? (
          <button
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
            onClick={() => setFilters({ priorities: [], status: "all", sharedWithMe: false })}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}

function UserMenu({ onClose }) {
  const ref = useClickOutside(onClose);
  const navigate = useNavigate();
  const user = S.useStore(S.authStore, (s) => s.user) || {};
  return (
    <div className="popover on-surface" ref={ref} style={{ top: 44, right: 0, width: 210 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
        <Avatar user={user} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>@{user.username}</div>
          <div className="char-count">{user.email}</div>
        </div>
      </div>
      <div className="menu-sep" />
      <button
        className="menu-item danger"
        onClick={() => {
          onClose();
          S.logout();
          navigate("/login");
        }}
      >
        <Icon name="logout" size={15} /> Sair
      </button>
    </div>
  );
}

export function Header({ filters, setFilters, hideCompleted, setHideCompleted }) {
  const theme = S.useStore(S.themeStore, (s) => s.current);
  const user = S.useStore(S.authStore, (s) => s.user) || {};
  const [showFilter, setShowFilter] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const filterActive =
    filters.priorities.length || filters.status !== "all" || filters.sharedWithMe;

  return (
    <header className="fo-header">
      <div className="fo-logo">
        Flow <span className="brand">Orizon</span>
      </div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: 14,
          color: "var(--text-faint)",
          fontWeight: 500,
        }}
      >
        Meu quadro
      </div>
      <div className="header-tools">
        <div style={{ position: "relative" }}>
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setShowFilter((s) => !s)}
            title="Filtros"
            style={
              filterActive
                ? {
                    color: "var(--accent-strong)",
                    background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  }
                : {}
            }
          >
            <Icon name="filter" size={18} />
          </button>
          {showFilter && (
            <FilterPopover
              filters={filters}
              setFilters={setFilters}
              onClose={() => setShowFilter(false)}
            />
          )}
        </div>

        <button className="toggle" onClick={() => setHideCompleted((v) => !v)}>
          <Icon name={hideCompleted ? "eye-off" : "eye"} size={16} />
          <span>Ocultar concluídas</span>
          <span className={"switch" + (hideCompleted ? " on" : "")} />
        </button>

        <div className="theme-pills">
          {S.THEMES.map((t) => (
            <button
              key={t}
              className={"theme-pill" + (theme === t ? " active" : "")}
              title={THEME_META[t].label}
              onClick={() => S.setTheme(t)}
            >
              <span className="swatch" style={{ background: THEME_META[t].sw }} />
            </button>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <div onClick={() => setShowUser((s) => !s)}>
            <Avatar user={user} />
          </div>
          {showUser && <UserMenu onClose={() => setShowUser(false)} />}
        </div>
      </div>
    </header>
  );
}
