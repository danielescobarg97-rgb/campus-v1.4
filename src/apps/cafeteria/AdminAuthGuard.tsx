import React, { useState } from 'react';
import { CafeteriaApp } from './CafeteriaApp';
import { Lock, User, KeyRound, ChefHat, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminAuthGuard: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('campusbite_admin_auth') === 'true';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Clear auth session whenever user leaves /admin
  React.useEffect(() => {
    return () => {
      sessionStorage.removeItem('campusbite_admin_auth');
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim().toUpperCase();
    const cleanPass = password.trim();

    if (cleanUser === 'ADMIN' && cleanPass === 'ADMIN') {
      sessionStorage.setItem('campusbite_admin_auth', 'true');
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError(
        'ACCESO PROHIBIDO: Nombre o contraseña incorrectos. Solo el personal de cafetería con credenciales ADMIN puede ingresar.'
      );
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('campusbite_admin_auth');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isAuthenticated) {
    return <CafeteriaApp onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-600/20 text-red-500 mx-auto flex items-center justify-center border border-red-500/30 shadow-xl shadow-red-600/20">
          <ChefHat className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 uppercase tracking-wider inline-block mb-1">
            Zona de Seguridad KDS
          </span>
          <h1 className="text-xl font-black text-white">Acceso de Administrador</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingreso restringido a cocina. No permitido para estudiantes.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-700 rounded-2xl flex items-start gap-2 text-xs text-red-200 font-bold text-left animate-in shake">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 text-left text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-300 block">Nombre de Administrador</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setError(null);
                  setUsername(e.target.value);
                }}
                placeholder="ADMIN"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-300 block">Contraseña de Administrador</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setError(null);
                  setPassword(e.target.value);
                }}
                placeholder="ADMIN"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
            ℹ️ Nombre: <strong className="text-red-400">ADMIN</strong> | Contraseña: <strong className="text-red-400">ADMIN</strong>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Validar e Ingresar</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a Selección de Roles
          </button>
        </div>
      </div>
    </div>
  );
};
