/* ============================================================
   Flow Orizon — Column + ColumnHeader + ColumnMenu
   ============================================================ */
import { useEffect, useRef, useState } from "react";

import D from "../data.js";
import S from "../store.js";
import { PostIt } from "./PostIt.jsx";
import { Icon, useClickOutside } from "./ui.jsx";

function ColumnMenu({ category, onClose }) {
  const ref = useClickOutside(onClose);
  const [view, setView] = useState("root");
  return (
    <div className="popover on-surface" ref={ref} style={{ top: 36, right: 0 }}>
      {view === "root" && (
        <>
          <button
            className="menu-item"
            onClick={() => {
              onClose();
              document.dispatchEvent(
                new CustomEvent("fo-rename-col", { detail: category.id })
              );
            }}
          >
            <Icon name="pencil" size={15} /> Renomear
          </button>
          <button className="menu-item" onClick={() => setView("color")}>
            <Icon name="palette" size={15} /> Mudar cor padrão
          </button>
          <button className="menu-item" onClick={() => setView("applyConfirm")}>
            <Icon name="grid" size={15} /> Aplicar cor a todos os post-its
          </button>
          <div className="menu-sep" />
          <button className="menu-item danger" onClick={() => setView("deleteConfirm")}>
            <Icon name="trash" size={15} /> Deletar categoria
          </button>
        </>
      )}
      {view === "color" && (
        <div style={{ padding: 6, width: 232 }}>
          <div className="field-label" style={{ marginBottom: 8 }}>
            Cor padrão da coluna
          </div>
          <div className="color-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            {D.PALETTE.map((c) => (
              <button
                key={c}
                className={"color-dot" + (category.default_color === c ? " selected" : "")}
                style={{ background: c }}
                title={D.COLOR_NAMES[c]}
                onClick={() => {
                  S.updateCategory(category.id, { default_color: c });
                  onClose();
                }}
              >
                {category.default_color === c && (
                  <span className="chk">
                    <Icon name="check" size={14} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {view === "applyConfirm" && (
        <div style={{ padding: 10, width: 240 }}>
          <div style={{ fontSize: 13.5, marginBottom: 4, fontWeight: 600 }}>
            Aplicar cor a todos?
          </div>
          <div
            className="sub"
            style={{ fontSize: 12.5, color: "var(--text-faint)", marginBottom: 12 }}
          >
            Todos os post-its desta coluna passam a usar a cor padrão. Cores
            individuais serão sobrescritas.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => {
                S.applyColumnColorToAll(category.id, category.default_color);
                onClose();
              }}
            >
              Aplicar
            </button>
            <button className="btn btn-ghost" onClick={() => setView("root")}>
              Voltar
            </button>
          </div>
        </div>
      )}
      {view === "deleteConfirm" && (
        <div style={{ padding: 10, width: 240 }}>
          <div style={{ fontSize: 13.5, marginBottom: 4, fontWeight: 600 }}>
            Deletar “{category.name}”?
          </div>
          <div
            className="sub"
            style={{ fontSize: 12.5, color: "var(--text-faint)", marginBottom: 12 }}
          >
            Os post-its desta coluna ficarão sem categoria (não serão deletados).
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-danger"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => {
                S.deleteCategory(category.id);
                onClose();
              }}
            >
              Deletar
            </button>
            <button className="btn btn-ghost" onClick={() => setView("root")}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColumnHeader({ category, count }) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const inputRef = useRef(null);

  useEffect(() => {
    function onRename(e) {
      if (e.detail === category.id) {
        setName(category.name);
        setEditing(true);
      }
    }
    document.addEventListener("fo-rename-col", onRename);
    return () => document.removeEventListener("fo-rename-col", onRename);
  }, [category.id, category.name]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    const v = name.trim();
    if (v && v !== category.name) S.updateCategory(category.id, { name: v });
    setEditing(false);
  }

  return (
    <div className="col-header">
      <span className="col-dot" style={{ background: category.default_color }} />
      {editing ? (
        <input
          ref={inputRef}
          className="col-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setName(category.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span
          className="col-name"
          onDoubleClick={() => {
            setName(category.name);
            setEditing(true);
          }}
          title="Duplo-clique para renomear"
        >
          {category.name}
        </span>
      )}
      <span className="col-count">({count})</span>
      <div className="col-menu-btn" style={{ position: "relative" }}>
        <button className="btn btn-icon btn-ghost" onClick={() => setMenu((m) => !m)}>
          <Icon name="more" size={18} />
        </button>
        {menu && <ColumnMenu category={category} onClose={() => setMenu(false)} />}
      </div>
    </div>
  );
}

export function Column({
  category,
  items,
  count,
  columnColor,
  onOpenTask,
  onStartDrag,
  draggingId,
  isDropTarget,
  registerColRef,
  onAdd,
}) {
  return (
    <div
      className={"column" + (isDropTarget ? " drop-target" : "")}
      ref={(el) => registerColRef(category.id, el)}
      data-col={category.id}
    >
      <ColumnHeader category={category} count={count} />
      <div className="col-body" data-colbody={category.id}>
        {items.length === 0 && (
          <div className="col-empty">
            Solte um post-it aqui
            <br />
            ou clique em “Adicionar”.
          </div>
        )}
        {items.map((it) =>
          it.__ph ? (
            <div key="ph" className="postit-placeholder" />
          ) : (
            <PostIt
              key={it.id}
              task={it}
              columnColor={columnColor}
              onOpen={onOpenTask}
              onStartDrag={onStartDrag}
              dragging={it.id === draggingId}
            />
          )
        )}
      </div>
      <button className="col-add" onClick={() => onAdd(category.id)}>
        <Icon name="plus" size={15} /> Adicionar
      </button>
    </div>
  );
}
