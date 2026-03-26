import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo2 from "../logo2.png";

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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        fontFamily: "'Space Grotesk', 'Manrope', 'Segoe UI', sans-serif",
        backgroundImage:
          "radial-gradient(circle at top left, rgba(251, 191, 36, 0.16), transparent 55%), radial-gradient(circle at 80% 10%, rgba(59, 130, 246, 0.12), transparent 50%), linear-gradient(180deg, #0a0a0a 0%, #0c0c0c 100%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-20 flex items-center justify-center overflow-hidden mb-3">
            <img src={logo2} alt="SmartSlit" className="w-full h-full object-contain" />
          </div>
          <div className="text-xs uppercase tracking-widest text-emerald-300 font-semibold mb-1">
            SmartSlit
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100">Planejamento de Corte</h1>
          <p className="text-zinc-400 text-sm mt-1">Otimize cortes. Reduza sucata.</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-zinc-950 rounded-xl p-1">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                tab === "login"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                tab === "register"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="voce@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  required
                  value={regForm.companyName}
                  onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="Metalúrgica Exemplo Ltda"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={regForm.displayName}
                  onChange={(e) => setRegForm({ ...regForm, displayName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="voce@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium uppercase tracking-wide">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {loading ? "Cadastrando..." : "Criar conta"}
              </button>
            </form>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs text-zinc-500">
              <span className="bg-zinc-900 px-2">ou continue com</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-medium py-2.5 rounded-xl transition text-sm disabled:opacity-50"
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

        <p className="text-center text-zinc-600 text-xs mt-6">
          SmartSlit © {new Date().getFullYear()} — Otimização Industrial de Corte
        </p>
      </div>
    </div>
  );
}
