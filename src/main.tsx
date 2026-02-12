import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "@/index.css";

import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ChoosePlan from "@/pages/ChoosePlan";
import ChooseModules from "@/pages/ChooseModules";
import DashboardPage from "@/pages/DashboardPage";

import AppLayout from "@/layouts/AppLayout";
import AppGuard from "@/pages/AppGuard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/onboarding/plan"
            element={
              <ProtectedRoute>
                <ChoosePlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/modules"
            element={
              <ProtectedRoute>
                <ChooseModules />
              </ProtectedRoute>
            }
          />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route element={<AppGuard />}>
              <Route index element={<DashboardPage />} />
              <Route path="clients" element={<div className="bg-white rounded-2xl shadow p-5">Clients</div>} />
              <Route path="clients/new" element={<div className="bg-white rounded-2xl shadow p-5">New Client</div>} />
              <Route path="module-1" element={<div className="bg-white rounded-2xl shadow p-5">Module 1</div>} />
              <Route path="module-2" element={<div className="bg-white rounded-2xl shadow p-5">Module 2</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
