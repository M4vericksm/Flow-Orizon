/* ============================================================
   Flow Orizon — Board + drag-and-drop por ponteiro
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";

import S from "../store.js";
import { Column } from "./Column.jsx";
import { Header } from "./Header.jsx";
import { PostIt } from "./PostIt.jsx";
import { PostItModal } from "./PostItModal.jsx";
import { Icon, Portal, Spinner } from "./ui.jsx";

export function Board() {
  const { categories, tasks, loading, loaded } = S.useStore(S.boardStore);
  const me = S.useStore(S.authStore, (s) => s.user);

  const [filters, setFilters] = useState({ priorities: [], status: "all", sharedWithMe: false });
  const [hideCompleted, setHideCompleted] = useState(false);
  const [modal, setModal] = useState(null);

  const [drag, setDrag] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const dragRef = useRef(null);
  const pendingRef = useRef(null);
  const dropRef = useRef(null);
  const justDraggedRef = useRef(false);
  const colBodyRefs = useRef({});
  const colItemsRef = useRef({});

  useEffect(() => {
    if (!loaded && !loading) S.fetchAll();
  }, [loaded, loading]);

  // ---------- filtragem ----------
  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (hideCompleted && t.is_completed) return false;
        if (filters.status === "pending" && t.is_completed) return false;
        if (filters.status === "done" && !t.is_completed) return false;
        if (filters.priorities.length && !filters.priorities.includes(t.priority)) return false;
        if (filters.sharedWithMe) {
          const mine = t.owner === me?.username;
          const sharedWithMe = (t.shares || []).some((sh) => sh.shared_with === me?.username);
          if (mine || !sharedWithMe) return false;
        }
        return true;
      }),
    [tasks, hideCompleted, filters, me]
  );

  // ---------- agrupamento por coluna ----------
  const catIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);

  const base = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = visible
        .filter((t) => t.category === c.id)
        .sort((a, b) => a.display_order - b.display_order);
    });
    return map;
  }, [categories, visible]);

  // Tarefas sem categoria (deletada) ou de categoria de outro dono (compartilhadas).
  const orphans = useMemo(
    () =>
      visible
        .filter((t) => !catIds.has(t.category))
        .filter((t) => !drag || t.id !== drag.task.id),
    [visible, catIds, drag]
  );

  const display = useMemo(() => {
    const out = {};
    categories.forEach((c) => {
      out[c.id] = base[c.id].filter((t) => !drag || t.id !== drag.task.id);
    });
    colItemsRef.current = {};
    categories.forEach((c) => {
      colItemsRef.current[c.id] = out[c.id].slice();
    });
    if (drag && dropTarget && out[dropTarget.cat]) {
      out[dropTarget.cat] = [
        ...out[dropTarget.cat].slice(0, dropTarget.index),
        { __ph: true },
        ...out[dropTarget.cat].slice(dropTarget.index),
      ];
    }
    return out;
  }, [categories, base, drag, dropTarget]);

  // ---------- drag por ponteiro ----------
  useEffect(() => {
    function onMove(e) {
      const pend = pendingRef.current;
      if (pend && !dragRef.current) {
        const dist = Math.hypot(e.clientX - pend.startX, e.clientY - pend.startY);
        if (dist > 5) {
          const d = {
            task: pend.task,
            x: e.clientX,
            y: e.clientY,
            offsetX: pend.offsetX,
            offsetY: pend.offsetY,
            w: pend.w,
            h: pend.h,
          };
          dragRef.current = d;
          setDrag(d);
          document.body.style.cursor = "grabbing";
        }
      }
      const d = dragRef.current;
      if (d) {
        d.x = e.clientX;
        d.y = e.clientY;
        setDrag({ ...d });
        let target = null;
        for (const [cid, el] of Object.entries(colBodyRefs.current)) {
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (
            e.clientX >= r.left - 12 &&
            e.clientX <= r.right + 12 &&
            e.clientY >= r.top - 60 &&
            e.clientY <= r.bottom + 200
          ) {
            const kids = [...el.querySelectorAll("[data-postit]")];
            let idx = kids.length;
            for (let i = 0; i < kids.length; i++) {
              const kr = kids[i].getBoundingClientRect();
              if (e.clientY < kr.top + kr.height / 2) {
                idx = i;
                break;
              }
            }
            target = { cat: Number(cid), index: idx };
            break;
          }
        }
        dropRef.current = target;
        setDropTarget(target);
      }
    }
    function onUp() {
      const d = dragRef.current;
      const tgt = dropRef.current;
      if (d) {
        justDraggedRef.current = true;
        if (tgt) {
          const destIds = (colItemsRef.current[tgt.cat] || []).map((t) => t.id);
          destIds.splice(tgt.index, 0, d.task.id);
          S.moveTask(d.task.id, tgt.cat, destIds);
        }
        document.body.style.cursor = "";
      }
      pendingRef.current = null;
      dragRef.current = null;
      dropRef.current = null;
      setDrag(null);
      setDropTarget(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function startDrag(task, e) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    pendingRef.current = {
      task,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - r.left,
      offsetY: e.clientY - r.top,
      w: r.width,
      h: r.height,
    };
  }

  function onClickCapture(e) {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  }

  const colColor = (catId) => (categories.find((c) => c.id === catId) || {}).default_color;
  const openTask = (task) => setModal({ task, isNew: false });
  const addToCat = (catId) => {
    if (!catId) {
      S.toast("Crie uma categoria primeiro", "error");
      return;
    }
    setModal({ task: { category: catId }, isNew: true });
  };

  async function addColumn() {
    const cat = await S.addCategory("Nova categoria");
    if (!cat) return;
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("fo-rename-col", { detail: cat.id }));
      const sc = document.querySelector(".board-scroll");
      if (sc) sc.scrollTo({ left: sc.scrollWidth, behavior: "smooth" });
    }, 60);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Header
        filters={filters}
        setFilters={setFilters}
        hideCompleted={hideCompleted}
        setHideCompleted={setHideCompleted}
      />

      {loading && !loaded ? (
        <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
          <Spinner dark />
        </div>
      ) : (
        <div className="board-scroll" onClickCapture={onClickCapture}>
          {categories.map((c) => (
            <Column
              key={c.id}
              category={c}
              items={display[c.id] || []}
              count={base[c.id] ? base[c.id].length : 0}
              columnColor={c.default_color}
              onOpenTask={openTask}
              onStartDrag={startDrag}
              draggingId={drag ? drag.task.id : null}
              isDropTarget={dropTarget && dropTarget.cat === c.id}
              registerColRef={(id, el) => {
                colBodyRefs.current[id] = el ? el.querySelector(".col-body") : null;
              }}
              onAdd={addToCat}
            />
          ))}

          {orphans.length > 0 && (
            <div className="column">
              <div className="col-header">
                <span className="col-dot" style={{ background: "var(--text-faint)" }} />
                <span className="col-name">Sem categoria</span>
                <span className="col-count">({orphans.length})</span>
              </div>
              <div className="col-body">
                {orphans.map((it) => (
                  <PostIt
                    key={it.id}
                    task={it}
                    columnColor={null}
                    onOpen={openTask}
                    onStartDrag={startDrag}
                    dragging={drag && it.id === drag.task.id}
                  />
                ))}
              </div>
            </div>
          )}

          <button className="add-column-btn" onClick={addColumn}>
            <Icon name="plus" size={16} /> Nova categoria
          </button>
        </div>
      )}

      <button
        className="fab"
        onClick={() => addToCat(categories[0] && categories[0].id)}
        title="Novo post-it"
      >
        <Icon name="plus" size={26} />
      </button>

      {drag && (
        <Portal>
          <div
            style={{
              position: "fixed",
              left: drag.x - drag.offsetX,
              top: drag.y - drag.offsetY,
              width: drag.w,
              pointerEvents: "none",
              zIndex: 1000,
            }}
          >
            <PostIt
              task={drag.task}
              columnColor={colColor(drag.task.category)}
              onOpen={() => {}}
              onStartDrag={() => {}}
              dragging
            />
          </div>
        </Portal>
      )}

      {modal && (
        <PostItModal task={modal.task} isNew={modal.isNew} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
