import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { StudentApp } from './apps/student/StudentApp';
import { AdminAuthGuard } from './apps/cafeteria/AdminAuthGuard';
import { AuthPortal } from './apps/auth/AuthPortal';
import { getCurrentStudent, subscribeCurrentStudent } from './services/store';
import { StudentUser } from './types';

function StudentRoot() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentUser | null>(() => getCurrentStudent());

  useEffect(() => {
    const unsub = subscribeCurrentStudent((s) => {
      setStudent(s);
    });
    return () => unsub();
  }, []);

  if (student) {
    return <StudentApp onLogout={() => setStudent(null)} />;
  }

  return (
    <AuthPortal
      onStudentLoginSuccess={(loggedStudent) => {
        setStudent(loggedStudent);
      }}
      onAdminLoginSuccess={() => {
        navigate('/admin');
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Portal Principal: Selector de Rol (Estudiante o Administrador) y Vista Estudiante */}
        <Route path="/" element={<StudentRoot />} />

        {/* Ruta de Cafetería / Cocina KDS: Protegida estrictamente con ADMIN / ADMIN */}
        <Route path="/admin" element={<AdminAuthGuard />} />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
