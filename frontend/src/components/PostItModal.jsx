/* ============================================================
   Flow Orizon — PostItModal (Detalhes / Compartilhar / Avançado)
   ============================================================ */
import { useState } from "react";

import D from "../data.js";
import S from "../store.js";
import { Avatar, Icon, Portal, Spinner, useClickOutside } from "./ui.jsx";

function ColorGrid({ value, onPick, allowColumn, columns = 8 }) {
  return (
    <div>
      <div
        className="color-grid"
        style={{
          gridTemplateColumns: `repeat(${columns},1fr)`,
          maxWidth: columns === 4 ? 260 : "100%",
        }}
      >
        {D.PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className={"color-dot" + (value === c ? " selected" : "")}
            style={{ background: c }}
            title={D.COLOR_NAMES[c]}
            onClick={() => onPick(c)}
          >
            {value === c && (
              <span className="chk">
                <Icon name="check" size={14} strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>
      {allowColumn && (
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 10, fontSize: 13 }}
          onClick={() => onPick(null)}
        >
          <Icon name="palette" size={15} /> Usar cor da coluna
          {!value && (
            <Icon name="check" size={14} strokeWidth={3} style={{ color: "var(--accent-strong)" }} />
          )}
        </button>
      )}
    </div>
  );
}

function DetailsTab({ draft, set, categories }) {
  const PRIOS = [
    ["low", "Baixa"],
    ["medium", "Média"],
    ["high", "Alta"],
  ];
  return (
    <div className="stack">
      <div>
        <label className="field-label">Título</label>
        <input
          className="input"
          maxLength={59}
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Ex: Revisar contrato"
        />
        <div style={{ textAlign: "right", marginTop: 4 }}>
          <span className="char-count">{draft.title.length}/59</span>
        </div>
      </div>
      <div>
        <label className="field-label">Descrição</label>
        <textarea
          className="textarea"
          maxLength={200}
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Detalhes da tarefa…"
        />
        <div style={{ textAlign: "right", marginTop: 4 }}>
          <span className="char-count">{draft.description.length}/200</span>
        </div>
      </div>
      <div className="row">
        <div>
          <label className="field-label">Categoria</label>
          <select
            className="select"
            value={draft.category ?? ""}
            onChange={(e) => set({ category: Number(e.target.value) })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Prazo</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="date"
              className="input"
              value={draft.due_date || ""}
              onChange={(e) => set({ due_date: e.target.value || null })}
            />
            {draft.due_date && (
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={() => set({ due_date: null })}
                title="Limpar"
              >
                <Icon name="x" size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div>
        <label className="field-label">Prioridade</label>
        <div className="segmented">
          {PRIOS.map(([v, lbl]) => (
            <button
              key={v}
              type="button"
              className={"seg" + (draft.priority === v ? " active" : "")}
              onClick={() => set({ priority: v })}
            >
              <span className={"pi-prio " + v} style={{ width: 16, height: 16 }}>
                <Icon name="flag" size={10} strokeWidth={2.4} />
              </span>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="field-label">Cor do post-it</label>
        <ColorGrid value={draft.color} onPick={(c) => set({ color: c })} allowColumn columns={4} />
      </div>
      <div className="toggle-row">
        <div>
          <div className="lbl">Observação destacada</div>
          <div className="sub">Fixa uma tachinha vermelha no post-it</div>
        </div>
        <button
          type="button"
          className={"switch" + (draft.is_highlighted ? " on" : "")}
          onClick={() => set({ is_highlighted: !draft.is_highlighted })}
        />
      </div>
      <div className="toggle-row">
        <div>
          <div className="lbl">Concluída</div>
          <div className="sub">Risca o título e reduz a opacidade</div>
        </div>
        <button
          type="button"
          className={"switch" + (draft.is_completed ? " on" : "")}
          onClick={() => set({ is_completed: !draft.is_completed })}
        />
      </div>
    </div>
  );
}

function ShareTab({ task, amOwner, me }) {
  const [username, setUsername] = useState("");
  const [perm, setPerm] = useState("read");
  const shares = task.shares || [];
  const sharedByMe = task.owner !== me?.username ? task.owner : null;

  function add() {
    const u = username.trim();
    if (!u) return;
    S.addShare(task.id, u, perm);
    setUsername("");
  }

  return (
    <div className="stack">
      {sharedByMe && (
        <div className="banner" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar user={{ username: sharedByMe }} size="sm" />
          <span>
            Compartilhado com você por <strong>@{sharedByMe}</strong>
          </span>
        </div>
      )}

      <div>
        <label className="field-label">Pessoas com acesso ({shares.length})</label>
        <div className="stack" style={{ marginTop: 0 }}>
          {shares.length === 0 && (
            <div className="col-empty" style={{ textAlign: "left" }}>
              Ninguém ainda. {amOwner ? "Adicione alguém abaixo." : ""}
            </div>
          )}
          {shares.map((sh) => (
            <div key={sh.id} className="share-row">
              <Avatar user={{ username: sh.shared_with }} size="sm" />
              <div style={{ flex: 1 }}>
                <div className="share-name">@{sh.shared_with}</div>
              </div>
              {amOwner ? (
                <>
                  <select
                    className="select"
                    style={{ width: 130 }}
                    value={sh.permission}
                    onChange={(e) =>
                      S.updateSharePermission(task.id, sh.shared_with, e.target.value)
                    }
                  >
                    <option value="read">Leitura</option>
                    <option value="read_write">Leitura e edição</option>
                  </select>
                  <button
                    className="btn btn-icon btn-ghost"
                    title="Remover"
                    onClick={() => S.removeShare(task.id, sh.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </>
              ) : (
                <span className="char-count">
                  {sh.permission === "read_write" ? "leitura e edição" : "leitura"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {amOwner && (
        <div>
          <label className="field-label">Adicionar pessoa (username)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="ex: maria"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
            <select
              className="select"
              style={{ width: 150 }}
              value={perm}
              onChange={(e) => setPerm(e.target.value)}
            >
              <option value="read">Leitura</option>
              <option value="read_write">Leitura e edição</option>
            </select>
            <button type="button" className="btn btn-primary" onClick={add}>
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdvancedTab({ task, amOwner, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div>
      <div className="info-row">
        <span className="k">Criado em</span>
        <span className="v">{D.fmtLongDate(task.created_at)}</span>
      </div>
      <div className="info-row">
        <span className="k">Atualizado em</span>
        <span className="v">{D.fmtLongDate(task.updated_at)}</span>
      </div>
      <div className="info-row" style={{ borderBottom: "none" }}>
        <span className="k">Dono</span>
        <span className="v">@{task.owner}</span>
      </div>
      {amOwner && (
        <div style={{ marginTop: 22 }}>
          {!confirming ? (
            <button className="btn btn-danger" onClick={() => setConfirming(true)}>
              <Icon name="trash" size={15} /> Deletar post-it
            </button>
          ) : (
            <div
              className="banner"
              style={{ background: "rgba(226,59,59,.1)", borderColor: "rgba(226,59,59,.35)" }}
            >
              <div style={{ marginBottom: 10 }}>Tem certeza? Esta ação não pode ser desfeita.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-danger" onClick={onDelete}>
                  Sim, deletar
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PostItModal({ task, isNew, onClose }) {
  const categories = S.useStore(S.boardStore, (s) => s.categories);
  const me = S.useStore(S.authStore, (s) => s.user);
  const [tab, setTab] = useState("details");
  const [draft, setDraft] = useState(() => ({
    title: task.title || "",
    description: task.description || "",
    category: task.category ?? (categories[0] && categories[0].id),
    color: task.color || null,
    priority: task.priority || "medium",
    due_date: task.due_date ? task.due_date.slice(0, 10) : null,
    is_highlighted: !!task.is_highlighted,
    is_completed: !!task.is_completed,
  }));
  const [saving, setSaving] = useState(false);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const amOwner = isNew || task.owner === me?.username;

  // Versão "viva" da tarefa (os shares mudam direto no store).
  const liveTask =
    S.useStore(S.boardStore, (s) => s.tasks.find((t) => t.id === task.id)) || task;

  const ref = useClickOutside(onClose);
  const previewColor =
    draft.color ||
    (categories.find((c) => c.id === draft.category) || {}).default_color ||
    D.DEFAULT_COLOR;

  async function save() {
    setSaving(true);
    if (isNew) {
      await S.addTask(draft);
    } else {
      const patch = { ...draft };
      // Um editor (não-dono) não recategoriza a tarefa para as próprias colunas.
      if (!amOwner) delete patch.category;
      await S.updateTask(task.id, patch);
    }
    setSaving(false);
    onClose();
  }
  async function del() {
    const ok = await S.deleteTask(task.id);
    if (ok) onClose();
  }

  return (
    <Portal>
      <div className="overlay">
        <div className="modal on-surface" ref={ref}>
          <div className="modal-color-bar" style={{ background: previewColor }} />
          <div className="modal-head">
            <div className="modal-tabs">
              <button
                className={"tab" + (tab === "details" ? " active" : "")}
                onClick={() => setTab("details")}
              >
                Detalhes
              </button>
              <button
                className={"tab" + (tab === "share" ? " active" : "")}
                onClick={() => setTab("share")}
                disabled={isNew}
                style={isNew ? { opacity: 0.4, cursor: "not-allowed" } : {}}
              >
                Compartilhar com
              </button>
              <button
                className={"tab" + (tab === "advanced" ? " active" : "")}
                onClick={() => setTab("advanced")}
                disabled={isNew}
                style={isNew ? { opacity: 0.4, cursor: "not-allowed" } : {}}
              >
                Avançado
              </button>
            </div>
            <button className="btn btn-icon btn-ghost modal-close" onClick={onClose}>
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="modal-body">
            {tab === "details" && <DetailsTab draft={draft} set={set} categories={categories} />}
            {tab === "share" && !isNew && <ShareTab task={liveTask} amOwner={amOwner} me={me} />}
            {tab === "advanced" && !isNew && (
              <AdvancedTab task={liveTask} amOwner={amOwner} onDelete={del} />
            )}
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={save}
              disabled={saving || !draft.title.trim()}
            >
              {saving && <Spinner />} {isNew ? "Criar post-it" : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
