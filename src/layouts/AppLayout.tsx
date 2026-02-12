// src/layouts/AppLayout.tsx
import Sidebar from "@/components/sidebar/Sidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-(--background) text-(--foreground)">
      <Sidebar />

      <main className="flex-1 min-w-0 p-6">
        <Outlet />
      </main>
    </div>
  );
}
