import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoHorizontal from "../assets/betini/betini-logotipo-horizontal.svg";

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    email: "",
    password: "",
    companyName: "",
    displayName: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate("/");
    } catch (err) {
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!regForm.companyName.trim()) {
      setError("Informe o nome da empresa.");
      return;
    }
    setLoading(true);
    try {
      await register(regForm.email, regForm.password, regForm.companyName, regForm.displayName);
      navigate("/");
    } catch (err) {
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const translateError = (code) => {
    const map = {
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/user-not-found": "Usuário não encontrado.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/email-already-in-use": "Este e-mail já está cadastrado.",
      "auth/weak-password": "A senha deve ter ao menos 6 caracteres.",
      "auth/invalid-email": "E-mail inválido.",
      "auth/too-many-requests": "Muitas tentativas. Tente novamente em alguns minutos.",
    };
    return map[code] || "Erro ao autenticar. Tente novamente.";
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logoHorizontal} alt="Betini Studio" className="h-12 object-contain mb-3" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-1">
            Betini Studio · Slitter
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Planejamento de Corte</h1>
          <p className="text-ink-soft text-sm mt-1">Otimize cortes. Reduza sucata.</p>
        </div>

        {/* Card */}
        <div className="panel p-6">
          {/* Tabs */}
          <div className="segmented mb-6">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`segmented-option ${tab === "login" ? "active" : ""}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`segmented-option ${tab === "register" ? "active" : ""}`}
            >
              Cadastrar
            </button>
          </div>

          {error && (
            <div className="mb-4 callout-accent text-sm text-ink">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="field-label">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="field-input"
                  placeholder="voce@empresa.com"
                />
              </div>
              <div>
                <label className="field-label">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="field-input"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="field-label">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  required
                  value={regForm.companyName}
                  onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                  className="field-input"
                  placeholder="Metalúrgica Exemplo Ltda"
                />
              </div>
              <div>
                <label className="field-label">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={regForm.displayName}
                  onChange={(e) => setRegForm({ ...regForm, displayName: e.target.value })}
                  className="field-input"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="field-label">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="field-input"
                  placeholder="voce@empresa.com"
                />
              </div>
              <div>
                <label className="field-label">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="field-input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "Cadastrando..." : "Criar conta"}
              </button>
            </form>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-divider" />
            </div>
            <div className="relative flex justify-center text-xs text-ink-faint">
              <span className="bg-paper px-2">ou continue com</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="btn-quiet w-full py-2.5 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
        </div>

        <p className="text-center text-ink-faint text-xs mt-6">
          Betini Slitter © {new Date().getFullYear()} — Otimização Industrial de Corte
        </p>
      </div>
    </div>
  );
}
