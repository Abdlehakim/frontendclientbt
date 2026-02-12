/// App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

import Login from "@/pages/Login";
import AppLayout from "@/layouts/AppLayout";
import AppGuard from "@/pages/AppGuard"; // this should NOT render <Sidebar />

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Layout route: Sidebar appears once here */}
      <Route path="/app" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        {/* Index page inside the layout */}
        <Route index element={<AppGuard />} />

        {/* Example sub-pages */}
        <Route path="clients" element={<div className="bg-white rounded-2xl shadow p-5">Clients</div>} />
        <Route path="clients/new" element={<div className="bg-white rounded-2xl shadow p-5">New Client</div>} />
        <Route path="module-1" element={<div className="bg-white rounded-2xl shadow p-5">Module 1</div>} />
        <Route path="module-2" element={<div className="bg-white rounded-2xl shadow p-5">Module 2</div>} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/app" : "/login"} replace />} />
    </Routes>
  );
}
