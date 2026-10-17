import React, { useState } from 'react';
import { loginStudent, registerStudent } from '../../services/store';
import { StudentUser } from '../../types';
import {
  Coffee,
  GraduationCap,
  ChefHat,
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Wallet,
} from 'lucide-react';

interface AuthPortalProps {
  onStudentLoginSuccess: (student: StudentUser) => void;
  onAdminLoginSuccess: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onStudentLoginSuccess,
  onAdminLoginSuccess,
}) => {
  // Current view: 'select_role' | 'student_auth' | 'admin_auth'
  const [selectedRole, setSelectedRole] = useState<'select_role' | 'student_auth' | 'admin_auth'>(
    'select_role'
  );

  // Student form state
  const [studentMode, setStudentMode] = useState<'login' | 'register'>('login');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // Admin form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Handle Student Auth Submit
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentLoading(true);

    setTimeout(() => {
      if (studentMode === 'register') {
        if (!studentName.trim()) {
          setStudentError('Por favor ingresa tu nombre completo.');
          setStudentLoading(false);
          return;
        }
        if (!studentEmail.trim()) {
          setStudentError('Por favor ingresa tu correo universitario.');
          setStudentLoading(false);
          return;
        }
        if (studentPassword.length < 3) {
          setStudentError('La contraseña debe tener al menos 3 caracteres.');
          setStudentLoading(false);
          return;
        }

        const res = registerStudent(studentName, studentEmail, studentPassword);
        if (res.success && res.user) {
          onStudentLoginSuccess(res.user);
        } else {
          setStudentError(res.error || 'Error al registrar estudiante.');
        }
      } else {
        // Login
        const res = loginStudent(studentEmail, studentPassword);
        if (res.success && res.user) {
          onStudentLoginSuccess(res.user);
        } else {
          setStudentError(res.error || 'Credenciales de estudiante incorrectas.');
        }
      }
      setStudentLoading(false);
    }, 400);
  };

  // Quick fill student demo credentials
  const fillStudentDemo = () => {
    setStudentMode('login');
    setStudentEmail('valentina@universidad.edu.co');
    setStudentPassword('1234');
    setStudentError(null);
  };

  // Handle Admin Auth Submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    setTimeout(() => {
      const cleanUser = adminUsername.trim().toUpperCase();
      const cleanPass = adminPassword.trim();

      // Rule: Exactly ADMIN and ADMIN
      if (cleanUser === 'ADMIN' && cleanPass === 'ADMIN') {
        sessionStorage.setItem('campusbite_admin_auth', 'true');
        onAdminLoginSuccess();
      } else {
        setAdminError(
          'ACCESO DENEGADO: El nombre debe ser ADMIN y la contraseña debe ser ADMIN. Se prohíbe el ingreso no autorizado.'
        );
      }
      setAdminLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Brand Bar */}
      <header className="max-w-4xl mx-auto w-full pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-white block leading-none">
              CampusBite
            </span>
            <span className="text-xs text-orange-400 font-semibold mt-0.5 block">
              Más campus, menos filas • Plataforma Oficial
            </span>
          </div>
        </div>

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Control de Acceso Seguro
        </span>
      </header>

      {/* Center Dynamic Card */}
      <main className="max-w-xl mx-auto w-full my-auto py-6 animate-in fade-in duration-300">
        {/* STEP 1: Select Role */}
        {selectedRole === 'select_role' && (
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 text-center">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-orange-500 bg-orange-950/60 px-3 py-1 rounded-full border border-orange-800/50">
                Puerta de Entrada al Campus
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                ¿Cómo deseas ingresar a CampusBite?
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Selecciona tu perfil universitario para garantizar acceso seguro y personalizado
              </p>
            </div>

            {/* Role Options Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Option: Estudiante */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student_auth');
                  setStudentMode('login');
                }}
                className="group p-5 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700/80 hover:border-orange-500/80 text-left transition-all duration-200 hover:scale-[1.02] shadow-lg flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-colors flex items-center justify-center shadow-md">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-white group-hover:text-orange-400 transition-colors">
                      Soy Estudiante
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Pide comida sin filas, gestiona tu monedero <strong>CampusPay</strong> y retira
                      con tu código QR.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 group-hover:translate-x-1 transition-transform">
                  <span>Ingresar o Registrarme</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Option: Administrador Cocina */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin_auth')}
                className="group p-5 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700/80 hover:border-red-500/80 text-left transition-all duration-200 hover:scale-[1.02] shadow-lg flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors flex items-center justify-center shadow-md">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-white group-hover:text-red-400 transition-colors">
                      Soy Administrador
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Panel de cocina KDS, preparación por lotes, control de inventario y despacho
                      con lector QR.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 group-hover:translate-x-1 transition-transform">
                  <span>Acceso KDS Protegido</span>
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-slate-500">
              CampusBite v1.4 • Seguridad perimetral y sesiones aisladas
            </div>
          </div>
        )}

        {/* STEP 2: Student Login / Register Form */}
        {selectedRole === 'student_auth' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedRole('select_role')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar Rol
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                <GraduationCap className="w-4 h-4" /> Portal Estudiantil
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white">
                {studentMode === 'login' ? 'Bienvenido Estudiante' : 'Registro Único de Estudiante'}
              </h2>
              <p className="text-xs text-slate-400">
                {studentMode === 'login'
                  ? 'Ingresa a tu cuenta para ordenar y usar tu saldo personal'
                  : 'Regístrate una sola vez para tener tu monedero y carnet digital'}
              </p>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setStudentMode('login');
                  setStudentError(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  studentMode === 'login'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentMode('register');
                  setStudentError(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  studentMode === 'register'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Registrarme (1ra Vez)
              </button>
            </div>

            {/* Error banner */}
            {studentError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-red-300 font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{studentError}</span>
              </div>
            )}

            <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
              {studentMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Nombre Completo</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Ej. Valentina Torres o Juan Pérez"
                      className="w-full pl-10 pr-3 py-3 bg-slate-950 rounded-2xl border border-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-slate-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Correo Electrónico Universitario
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="estudiante@universidad.edu.co"
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 rounded-2xl border border-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Contraseña</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-slate-600"
                  />
                </div>
              </div>

              {studentMode === 'register' && (
                <div className="p-3 bg-orange-950/40 border border-orange-800/50 rounded-2xl text-[11px] text-orange-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    ¡Recibirás un <strong>bono de bienvenida de $25.000 COP</strong> en tu saldo
                    CampusPay para realizar tus primeros pedidos!
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={studentLoading}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-slate-700"
              >
                {studentLoading ? (
                  <span>Verificando...</span>
                ) : studentMode === 'login' ? (
                  <>
                    <span>Entrar a mi Cuenta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Completar Registro Único</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Helper */}
            {studentMode === 'login' && (
              <div className="pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={fillStudentDemo}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold underline decoration-dashed"
                >
                  ⚡ Autocompletar con estudiante demo (Valentina)
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Admin / Kitchen Login Form (Strict ADMIN / ADMIN) */}
        {selectedRole === 'admin_auth' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('select_role');
                  setAdminError(null);
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar Rol
              </button>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> ZONA RESTRINGIDA
              </span>
            </div>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-3xl bg-red-600/20 text-red-500 mx-auto flex items-center justify-center border border-red-500/30">
                <ChefHat className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-white">Ingreso de Administrador</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Acceso exclusivo para el personal de cocina. Los estudiantes tienen estrictamente
                prohibido el ingreso.
              </p>
            </div>

            {/* Error banner */}
            {adminError && (
              <div className="p-3.5 bg-red-950/80 border border-red-700 rounded-2xl flex items-start gap-2.5 text-xs text-red-200 font-bold animate-in shake">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Nombre de Administrador
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => {
                      setAdminError(null);
                      setAdminUsername(e.target.value);
                    }}
                    placeholder="Ingresa ADMIN"
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 rounded-2xl border border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-slate-600 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Contraseña de Administrador
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminError(null);
                      setAdminPassword(e.target.value);
                    }}
                    placeholder="Ingresa ADMIN"
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-400">
                🔒 <strong>Regla de seguridad:</strong> Nombre = <code className="text-red-400 font-bold">ADMIN</code> y Contraseña = <code className="text-red-400 font-bold">ADMIN</code>. Cualquier otro valor deniega el acceso.
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-slate-700"
              >
                {adminLoading ? (
                  <span>Autenticando credenciales...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validar e Ingresar a Cocina KDS</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 py-2 border-t border-slate-800/60">
        © 2026 CampusBite • Sistema Operativo Click & Collect y Cocina Inteligente
      </footer>
    </div>
  );
};
