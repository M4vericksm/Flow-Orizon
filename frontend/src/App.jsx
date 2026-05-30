import { Navigate, Route, Routes } from "react-router-dom";

import { Board } from "./components/Board.jsx";
import { LoginPage, RegisterPage } from "./components/Auth.jsx";
import { Toaster } from "./components/ui.jsx";
import S from "./store.js";

function useAuthUser() {
  return S.useStore(S.authStore, (s) => s.user);
}

// Rota que exige login; sem usuário, manda para /login.
function Protected({ children }) {
  const user = useAuthUser();
  return user ? children : <Navigate to="/login" replace />;
}

// Rota só para visitantes; logado, manda para o quadro.
function GuestOnly({ children }) {
  const user = useAuthUser();
  return user ? <Navigate to="/board" replace /> : children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route
          path="/board"
          element={
            <Protected>
              <Board />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
