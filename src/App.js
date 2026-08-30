import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import UsersPage from "@/pages/Users";
import Jobs from "@/pages/Jobs";
import JobWizard from "@/pages/JobWizard";
import JobDetail from "@/pages/JobDetail";
import CandidateDetail from "@/pages/CandidateDetail";
import Interviews from "@/pages/Interviews";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import AuditLog from "@/pages/AuditLog";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/new" element={<JobWizard />} />
              <Route path="/jobs/:id/edit" element={<JobWizard />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/applications/:id" element={<CandidateDetail />} />
              <Route path="/interviews" element={<Interviews />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/audit" element={<AuditLog />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
