/* ============================================================
   Flow Orizon — PostIt
   ============================================================ */
import { useEffect, useRef, useState } from "react";

import D from "../data.js";
import S from "../store.js";
import { Icon } from "./ui.jsx";

export function PostIt({ task, columnColor, onOpen, onStartDrag, dragging }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef(null);

  const color = task.color || columnColor || D.DEFAULT_COLOR;
  const rot = D.rotationFor(task.id);
  const overdue = D.isOverdue(task.due_date, task.is_completed);
  const sharedCount = (task.shares || []).length;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commitTitle() {
    const v = draft.trim().slice(0, 59);
    if (v && v !== task.title) S.updateTask(task.id, { title: v });
    setEditing(false);
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest("[data-control]")) return;
    if (editing) return;
    onStartDrag(task, e);
  }
  function onClick(e) {
    if (e.target.closest("[data-control]")) return;
    if (editing) return;
    onOpen(task);
  }

  const cls = ["postit"];
  if (task.is_completed) cls.push("completed");
  if (task.is_highlighted) cls.push("highlighted");
  if (dragging) cls.push("dragging");

  return (
    <div
      className={cls.join(" ")}
      style={{ background: color, "--rot": rot + "deg" }}
      onPointerDown={onPointerDown}
      onClick={onClick}
      data-postit={task.id}
    >
      <button
        className={"pi-check" + (task.is_completed ? " on" : "")}
        data-control
        onClick={(e) => {
          e.stopPropagation();
          S.toggleComplete(task.id);
        }}
        title={task.is_completed ? "Marcar como pendente" : "Marcar como concluída"}
      >
        {task.is_completed && <Icon name="check" size={12} strokeWidth={3} />}
      </button>

      <button
        className={"pi-pin" + (task.is_highlighted ? " on" : "")}
        data-control
        onClick={(e) => {
          e.stopPropagation();
          S.toggleHighlight(task.id);
        }}
        title={task.is_highlighted ? "Remover destaque" : "Destacar"}
      >
        <Icon name="pin" size={16} strokeWidth={task.is_highlighted ? 2.2 : 2} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          className="pi-title-input"
          data-control
          value={draft}
          maxLength={59}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitTitle();
            if (e.key === "Escape") {
              setDraft(task.title);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className={"pi-title" + (task.is_completed ? " struck" : "")}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setDraft(task.title);
            setEditing(true);
          }}
        >
          {task.title || "Sem título"}
        </div>
      )}

      {task.description ? (
        <div className="pi-desc">{task.description}</div>
      ) : (
        <div className="pi-desc" style={{ opacity: 0 }} />
      )}

      <div className="pi-foot">
        <span className={"pi-prio " + task.priority} title={"Prioridade: " + task.priority}>
          <Icon name="flag" size={12} strokeWidth={2.4} />
        </span>
        {task.due_date && (
          <span
            className={"pi-date" + (overdue ? " overdue" : "")}
            title={overdue ? "Atrasada" : "Prazo"}
          >
            <Icon name="calendar" size={12} />
            {D.fmtShortDate(task.due_date)}
          </span>
        )}
        {sharedCount > 0 && (
          <span
            className="pi-share"
            title={`Compartilhada com ${sharedCount} pessoa${sharedCount > 1 ? "s" : ""}`}
          >
            <Icon name="users" size={13} />
            {sharedCount}
          </span>
        )}
      </div>
    </div>
  );
}
