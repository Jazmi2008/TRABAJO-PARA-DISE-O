import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { DashboardPaciente } from './pages/DashboardPaciente';
import { DashboardDoctor } from './pages/DashboardDoctor';
import { DashboardRecepcionista } from './pages/DashboardRecepcionista';
import { CitasPaciente } from './pages/CitasPaciente';
import { CitasDoctor } from './pages/CitasDoctor';
import { CitasRecepcionista } from './pages/CitasRecepcionista';
import { AgendarCita } from './pages/AgendarCita';
import { AgendaDoctor } from './pages/AgendaDoctor';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Dashboards por rol */}
            <Route path="/dashboard-paciente" element={
              <ProtectedRoute roles={['PACIENTE']}>
                <DashboardPaciente />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-doctor" element={
              <ProtectedRoute roles={['DOCTOR']}>
                <DashboardDoctor />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-recepcionista" element={
              <ProtectedRoute roles={['RECEPCIONISTA']}>
                <DashboardRecepcionista />
              </ProtectedRoute>
            } />

            {/* Citas por rol */}
            <Route path="/citas-paciente" element={
              <ProtectedRoute roles={['PACIENTE']}>
                <CitasPaciente />
              </ProtectedRoute>
            } />
            <Route path="/citas-doctor" element={
              <ProtectedRoute roles={['DOCTOR']}>
                <CitasDoctor />
              </ProtectedRoute>
            } />
            <Route path="/citas-recepcionista" element={
              <ProtectedRoute roles={['RECEPCIONISTA']}>
                <CitasRecepcionista />
              </ProtectedRoute>
            } />

            {/* Otras rutas */}
            <Route path="/agendar" element={
              <ProtectedRoute roles={['RECEPCIONISTA']}>
                <AgendarCita />
              </ProtectedRoute>
            } />
            <Route path="/agenda" element={
              <ProtectedRoute roles={['DOCTOR']}>
                <AgendaDoctor />
              </ProtectedRoute>
            } />

            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
