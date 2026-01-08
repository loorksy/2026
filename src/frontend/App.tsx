import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Navbar from './components/Navbar';
import Login from './pages/Login';
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {isAuthenticated() && <Navbar />}
        <Routes>
          <Route path="/login" element={<Login />} />
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
    </BrowserRouter>
  );
}

export default App;
