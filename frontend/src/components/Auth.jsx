/* ============================================================
   Flow Orizon — páginas de autenticação (Login / Registro)
   ============================================================ */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import S from "../store.js";
import { Spinner } from "./ui.jsx";

function AuthDecor() {
  const bits = [
    { c: "#FFF9B0", t: -8, x: "8%", y: "18%", s: 130 },
    { c: "#D6E5FA", t: 6, x: "78%", y: "12%", s: 150 },
    { c: "#FFD6E0", t: -5, x: "14%", y: "64%", s: 120 },
    { c: "#D6F5D6", t: 7, x: "82%", y: "66%", s: 140 },
    { c: "#E5D4F1", t: -10, x: "68%", y: "82%", s: 110 },
  ];
  return (
    <>
      {bits.map((b, i) => (
        <div
          key={i}
          className="auth-decor"
          style={{
            left: b.x,
            top: b.y,
            width: b.s,
            height: b.s * 0.95,
            background: b.c,
            transform: `rotate(${b.t}deg)`,
            borderRadius: 7,
            boxShadow: "var(--shadow-pop)",
            opacity: 0.55,
          }}
        />
      ))}
    </>
  );
}

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="field-label">{label}</label>
      <input className="input" {...props} />
    </div>
  );
}

function Brand() {
  return (
    <div className="fo-logo auth-logo">
      Flow <span className="brand">Orizon</span>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await S.login(username, pwd);
      navigate("/board");
    } catch {
      S.toast("Usuário ou senha inválidos", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <AuthDecor />
      <form
        className="auth-card on-surface"
        onSubmit={submit}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Brand />
        <div className="auth-sub">Seu mural de tarefas</div>
        <Field
          label="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="seu_usuario"
          autoComplete="username"
        />
        <Field
          label="Senha"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          disabled={loading}
        >
          {loading && <Spinner />} Entrar
        </button>
        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 14,
            color: "var(--text-soft)",
          }}
        >
          Não tem conta?{" "}
          <span className="auth-link" onClick={() => navigate("/register")}>
            Criar conta
          </span>
        </div>
      </form>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [f, setF] = useState({ username: "", email: "", pwd: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const valid = f.username && f.pwd && f.pwd === f.confirm;

  async function submit(e) {
    e.preventDefault();
    if (!valid) {
      S.toast("Verifique os campos do formulário", "error");
      return;
    }
    setLoading(true);
    try {
      await S.register({ username: f.username, email: f.email, password: f.pwd });
      S.toast("Conta criada com sucesso", "success");
      navigate("/board");
    } catch (error) {
      const detail = error.response && error.response.data;
      const msg =
        (detail && detail.username && detail.username[0]) ||
        (detail && detail.password && detail.password[0]) ||
        "Não foi possível criar a conta";
      S.toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <AuthDecor />
      <form
        className="auth-card on-surface"
        onSubmit={submit}
        style={{ position: "relative", zIndex: 1 }}
      >
        <Brand />
        <div className="auth-sub">Crie sua conta</div>
        <Field
          label="Nome de usuário"
          value={f.username}
          onChange={set("username")}
          placeholder="seu_usuario"
          autoComplete="username"
        />
        <Field
          label="Email"
          type="email"
          value={f.email}
          onChange={set("email")}
          placeholder="voce@email.com"
          autoComplete="email"
        />
        <Field
          label="Senha"
          type="password"
          value={f.pwd}
          onChange={set("pwd")}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <Field
          label="Confirmar senha"
          type="password"
          value={f.confirm}
          onChange={set("confirm")}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          disabled={loading}
        >
          {loading && <Spinner />} Criar conta
        </button>
        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 14,
            color: "var(--text-soft)",
          }}
        >
          Já tem conta?{" "}
          <span className="auth-link" onClick={() => navigate("/login")}>
            Entrar
          </span>
        </div>
      </form>
    </div>
  );
}
