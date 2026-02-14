import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "@/index.css";

import "@/lib/swbDatePicker.css";
import "@/lib/swbDatePicker";

import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ChoosePlan from "@/pages/ChoosePlan";
import ChooseModules from "@/pages/ChooseModules";

import { APP_PATHS, APP_HREFS } from "@/routes/paths";
import AppLayout from "@/layouts/AppLayout";
import AppGuard from "@/pages/AppGuard";
import FerraillagePage from "@/pages/FerraillagePage";
import FerRapportViewPage from "@/pages/FerRapportViewPage";
import DashboardPage from "@/pages/DashboardPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
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
            <Route index element={<Navigate to={APP_HREFS.dashboard} replace />} />

            <Route element={<AppGuard />}>
              <Route path={APP_PATHS.dashboard} element={<DashboardPage />} />
              <Route path={APP_PATHS.ferraillage} element={<FerraillagePage />} />
              <Route
                path={`${APP_PATHS.ferraillage}/rapports/:rapportId`}
                element={<FerRapportViewPage />}
              />
            </Route>

            <Route path="*" element={<Navigate to={APP_HREFS.dashboard} replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
