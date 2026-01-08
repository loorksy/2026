import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { isAuthenticated } from './utils/auth';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';
import AuditLogs from './pages/AuditLogs';
import AccessDenied from './pages/AccessDenied';
import TrustedPersons from './pages/TrustedPersons';
import TrustedPersonDetail from './pages/TrustedPersonDetail';
import ManualTransfers from './pages/ManualTransfers';
import ManualTransferDetail from './pages/ManualTransferDetail';
import CreateManualTransfer from './pages/CreateManualTransfer';
import Reports from './pages/Reports';
import './App.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: ProtectedRouteProps) => {
  return isAuthenticated() ? <Navigate to="/" /> : <>{children}</>;
};

const AuthLayout = ({ children }: ProtectedRouteProps) => {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          {isAuthenticated() && <Navbar />}
          <Routes>
            {/* Auth routes (public but redirects if authenticated) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <Login />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <Register />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/auth/forgot-password"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <ForgotPassword />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/auth/reset-password"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <ResetPassword />
                  </AuthLayout>
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute>
                  <Roles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/permissions"
              element={
                <ProtectedRoute>
                  <Permissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/access-denied"
              element={
                <ProtectedRoute>
                  <AccessDenied />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trusted-persons"
              element={
                <ProtectedRoute>
                  <TrustedPersons />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trusted-persons/:id"
              element={
                <ProtectedRoute>
                  <TrustedPersonDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manual-transfers"
              element={
                <ProtectedRoute>
                  <ManualTransfers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manual-transfers/new"
              element={
                <ProtectedRoute>
                  <CreateManualTransfer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manual-transfers/:id"
              element={
                <ProtectedRoute>
                  <ManualTransferDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
