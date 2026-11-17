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
    <div className="min-h-screen bg-[#F5F6F8] text-[#032244] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#032244]/5 text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/assets/aistudio/UNIGO_logo_50365f1d.png"
            alt="UNIGO"
            className="h-9 w-auto object-contain"
          />
          <div className="w-14 h-14 rounded-2xl bg-[#032244] text-white mx-auto flex items-center justify-center shadow-lg shadow-[#032244]/20">
            <ChefHat className="w-7 h-7" />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#D7131A]/10 text-[#D7131A] border border-[#D7131A]/20 uppercase tracking-wider inline-block mb-1.5">
            Zona de Seguridad KDS
          </span>
          <h1 className="text-xl font-black text-[#032244]">Acceso de Administrador</h1>
          <p className="text-xs text-[#032244]/70 mt-1">
            Ingreso restringido a cocina. No permitido para estudiantes.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-[#D7131A] font-bold text-left animate-in shake">
            <ShieldAlert className="w-4 h-4 text-[#D7131A] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 text-left text-xs">
          <div className="space-y-1">
            <label className="font-bold text-[#032244] block">Nombre de Administrador</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#032244]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setError(null);
                  setUsername(e.target.value);
                }}
                placeholder="ADMIN"
                className="w-full pl-10 pr-3 py-2.5 bg-[#F5F6F8] border border-slate-200 rounded-xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#D7131A] focus:bg-white text-[#032244]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#032244] block">Contraseña de Administrador</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#032244]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setError(null);
                  setPassword(e.target.value);
                }}
                placeholder="ADMIN"
                className="w-full pl-10 pr-3 py-2.5 bg-[#F5F6F8] border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D7131A] focus:bg-white text-[#032244]"
              />
            </div>
          </div>

          <div className="p-2.5 bg-[#F5F6F8] rounded-xl border border-slate-200 text-[11px] text-[#032244]/75">
            Nombre: <strong className="text-[#D7131A]">ADMIN</strong> | Contraseña: <strong className="text-[#D7131A]">ADMIN</strong>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#D7131A] hover:bg-[#b51016] active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#D7131A]/20 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Validar e Ingresar</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-[#032244]/65 hover:text-[#032244] flex items-center justify-center gap-1 mx-auto transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a Selección de Roles
          </button>
        </div>
      </div>
    </div>
  );
};
