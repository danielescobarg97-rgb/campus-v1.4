import React, { useState } from 'react';
import { loginStudent, registerStudent } from '../../services/store';
import { StudentUser } from '../../types';
import {
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
  Loader2,
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

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Handle Student Auth Submit (Global async API persistence)
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentLoading(true);

    try {
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

        const res = await registerStudent(studentName, studentEmail, studentPassword);
        if (res.success && res.user) {
          onStudentLoginSuccess(res.user);
        } else {
          setStudentError(res.error || 'Error al registrar estudiante en la base central.');
        }
      } else {
        const res = await loginStudent(studentEmail, studentPassword);
        if (res.success && res.user) {
          onStudentLoginSuccess(res.user);
        } else {
          setStudentError(res.error || 'Credenciales de estudiante incorrectas.');
        }
      }
    } catch {
      setStudentError('Error al contactar con el servidor. Intenta nuevamente.');
    } finally {
      setStudentLoading(false);
    }
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
    <div className="min-h-screen bg-[#F5F6F8] text-[#032244] flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Brand Bar */}
      <header className="max-w-4xl mx-auto w-full pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/UNIGO_logo_50365f1d.png"
            alt="UNIGO"
            className="h-9 sm:h-10 w-auto object-contain"
          />
          <span className="hidden sm:inline-block h-6 w-px bg-[#032244]/15" />
          <span className="hidden sm:inline-block text-xs font-semibold text-[#032244]/70">
            Más campus, menos filas
          </span>
        </div>

        <span className="text-xs font-bold text-[#032244]/70">
          Cafetería Universitaria
        </span>
      </header>

      {/* Center Dynamic Card */}
      <main className="max-w-xl mx-auto w-full my-auto py-6 animate-in fade-in duration-300">
        {/* STEP 1: Select Role */}
        {selectedRole === 'select_role' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#032244]/5 space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#D7131A]">
                Puerta de Entrada al Campus
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#032244] leading-tight tracking-tight">
                ¿Cómo deseas ingresar hoy?
              </h1>
              <p className="text-xs sm:text-sm text-[#032244]/70 max-w-md mx-auto">
                Selecciona tu perfil universitario para acceder a pedidos sin filas o al panel operativo de cocina.
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
                className="group p-5 rounded-2xl bg-[#F5F6F8]/70 hover:bg-white border border-slate-200 hover:border-[#D7131A] text-left transition-all duration-200 hover:shadow-lg hover:shadow-[#D7131A]/10 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#D7131A]/10 text-[#D7131A] group-hover:bg-[#D7131A] group-hover:text-white transition-colors flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-[#032244] group-hover:text-[#D7131A] transition-colors">
                      Soy Estudiante
                    </h2>
                    <p className="text-xs text-[#032244]/70 mt-1 leading-relaxed">
                      Pide comida sin filas, gestiona tu monedero <strong>CampusPay</strong> y retira
                      con tu código QR.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-[#D7131A] group-hover:translate-x-1 transition-transform">
                  <span>Ingresar o Registrarme</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Option: Administrador Cocina */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin_auth')}
                className="group p-5 rounded-2xl bg-[#F5F6F8]/70 hover:bg-white border border-slate-200 hover:border-[#032244] text-left transition-all duration-200 hover:shadow-lg hover:shadow-[#032244]/10 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#032244]/10 text-[#032244] group-hover:bg-[#032244] group-hover:text-white transition-colors flex items-center justify-center">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-[#032244] transition-colors">
                      Soy Administrador
                    </h2>
                    <p className="text-xs text-[#032244]/70 mt-1 leading-relaxed">
                      Panel de cocina KDS, preparación por lotes, control de inventario y despacho
                      con lector QR.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-[#032244] group-hover:translate-x-1 transition-transform">
                  <span>Acceso KDS Protegido</span>
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-[#032244]/50 font-medium">
              Acceso seguro • Cuentas sincronizadas en tiempo real
            </div>
          </div>
        )}

        {/* STEP 2: Student Login / Register Form */}
        {selectedRole === 'student_auth' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#032244]/5 space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedRole('select_role')}
                className="text-xs text-[#032244]/70 hover:text-[#032244] flex items-center gap-1 font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar Rol
              </button>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#D7131A]">
                <GraduationCap className="w-4 h-4" /> Portal Estudiantil
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl font-extrabold text-[#032244] tracking-tight">
                {studentMode === 'login' ? 'Bienvenido Estudiante' : 'Registro de Estudiante'}
              </h2>
              <p className="text-xs text-[#032244]/70">
                {studentMode === 'login'
                  ? 'Ingresa a tu cuenta para ordenar y usar tu saldo CampusPay'
                  : 'Regístrate una sola vez para tener tu monedero y carnet digital'}
              </p>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 bg-[#F5F6F8] rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setStudentMode('login');
                  setStudentError(null);
                }}
                className={`py-2.5 rounded-xl transition-all ${
                  studentMode === 'login'
                    ? 'bg-[#D7131A] text-white shadow-sm'
                    : 'text-[#032244]/70 hover:text-[#032244]'
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
                className={`py-2.5 rounded-xl transition-all ${
                  studentMode === 'register'
                    ? 'bg-[#D7131A] text-white shadow-sm'
                    : 'text-[#032244]/70 hover:text-[#032244]'
                }`}
              >
                Registrarme (1ra Vez)
              </button>
            </div>

            {/* Error banner */}
            {studentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-[#D7131A] font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-[#D7131A] shrink-0" />
                <span>{studentError}</span>
              </div>
            )}

            <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
              {studentMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-[#032244] block">Nombre Completo</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#032244]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Ej. Valentina Torres o Juan Pérez"
                      className="w-full pl-10 pr-3 py-3 bg-[#F5F6F8] rounded-2xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#D7131A] focus:bg-white text-[#032244] placeholder-slate-400"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-[#032244] block">
                  Correo Electrónico Universitario
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#032244]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="estudiante@universidad.edu.co"
                    className="w-full pl-10 pr-3 py-3 bg-[#F5F6F8] rounded-2xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#D7131A] focus:bg-white text-[#032244] placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#032244] block">Contraseña</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#032244]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-3 bg-[#F5F6F8] rounded-2xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D7131A] focus:bg-white text-[#032244] placeholder-slate-400"
                  />
                </div>
              </div>

              {studentMode === 'register' && (
                <div className="p-3 bg-[#032244]/5 border border-[#032244]/15 rounded-2xl text-[11px] text-[#032244] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D7131A] shrink-0" />
                  <span>
                    Recibirás un <strong>bono de bienvenida de $25.000 COP</strong> en tu saldo
                    CampusPay para tus primeros pedidos.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={studentLoading}
                className="w-full py-3.5 bg-[#D7131A] hover:bg-[#b51016] active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#D7131A]/20 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
              >
                {studentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>
                      {studentMode === 'register'
                        ? 'Creando tu cuenta...'
                        : 'Verificando credenciales...'}
                    </span>
                  </>
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
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={fillStudentDemo}
                  className="text-xs text-[#D7131A] hover:text-[#b51016] font-bold underline decoration-dashed"
                >
                  Autocompletar con estudiante demo (Valentina)
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Admin / Kitchen Login Form (Strict ADMIN / ADMIN) */}
        {selectedRole === 'admin_auth' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#032244]/5 space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('select_role');
                  setAdminError(null);
                }}
                className="text-xs text-[#032244]/70 hover:text-[#032244] flex items-center gap-1 font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Cambiar Rol
              </button>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#D7131A]/10 text-[#D7131A] border border-[#D7131A]/20 flex items-center gap-1">
                <Lock className="w-3 h-3" /> ZONA RESTRINGIDA
              </span>
            </div>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-3xl bg-[#032244] text-white mx-auto flex items-center justify-center shadow-lg shadow-[#032244]/20">
                <ChefHat className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#032244]">Ingreso de Administrador</h2>
              <p className="text-xs text-[#032244]/70 max-w-sm mx-auto">
                Acceso exclusivo para el personal de cocina. Los estudiantes tienen estrictamente
                prohibido el ingreso.
              </p>
            </div>

            {/* Error banner */}
            {adminError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-[#D7131A] font-bold animate-in shake">
                <AlertCircle className="w-5 h-5 text-[#D7131A] shrink-0 mt-0.5" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#032244] block">
                  Nombre de Administrador
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#032244]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => {
                      setAdminError(null);
                      setAdminUsername(e.target.value);
                    }}
                    placeholder="Ingresa ADMIN"
                    className="w-full pl-10 pr-3 py-3 bg-[#F5F6F8] rounded-2xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#D7131A] focus:bg-white text-[#032244] placeholder-slate-400 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#032244] block">
                  Contraseña de Administrador
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#032244]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminError(null);
                      setAdminPassword(e.target.value);
                    }}
                    placeholder="Ingresa ADMIN"
                    className="w-full pl-10 pr-3 py-3 bg-[#F5F6F8] rounded-2xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D7131A] focus:bg-white text-[#032244] placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F5F6F8] border border-slate-200 rounded-2xl text-[11px] text-[#032244]/75">
                <strong>Regla de seguridad:</strong> Nombre = <code className="text-[#D7131A] font-bold">ADMIN</code> y Contraseña = <code className="text-[#D7131A] font-bold">ADMIN</code>.
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-3.5 bg-[#D7131A] hover:bg-[#b51016] active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#D7131A]/20 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
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
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-[#032244]/60 py-2 border-t border-slate-200">
        © 2026 UNIGO • Sistema Operativo Click & Collect y Cocina Inteligente
      </footer>
    </div>
  );
};
