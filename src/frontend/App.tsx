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
import Hosts from './pages/Hosts';
import SubAgents from './pages/SubAgents';
import ApprovedList from './pages/ApprovedList';
import TrustedPersons from './pages/TrustedPersons';
import TrustedPersonDetail from './pages/TrustedPersonDetail';
import Supervisors from './pages/Supervisors';
import Marketers from './pages/Marketers';
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
          {/* Hosts */}
          <Route
            path="/hosts"
            element={
              <ProtectedRoute>
                <Hosts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hosts/:id"
            element={
              <ProtectedRoute>
                <Hosts />
              </ProtectedRoute>
            }
          />
          {/* Sub-Agents */}
          <Route
            path="/sub-agents"
            element={
              <ProtectedRoute>
                <SubAgents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-agents/:id"
            element={
              <ProtectedRoute>
                <SubAgents />
              </ProtectedRoute>
            }
          />
          {/* Approved */}
          <Route
            path="/approved"
            element={
              <ProtectedRoute>
                <ApprovedList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approved/:id"
            element={
              <ProtectedRoute>
                <ApprovedList />
              </ProtectedRoute>
            }
          />
          {/* Trusted Persons */}
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
          {/* Supervisors */}
          <Route
            path="/supervisors"
            element={
              <ProtectedRoute>
                <Supervisors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisors/:id"
            element={
              <ProtectedRoute>
                <Supervisors />
              </ProtectedRoute>
            }
          />
          {/* Marketers */}
          <Route
            path="/marketers"
            element={
              <ProtectedRoute>
                <Marketers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketers/:id"
            element={
              <ProtectedRoute>
                <Marketers />
              </ProtectedRoute>
            }
          />
          {/* Manual Transfers */}
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
          {/* Reports */}
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
