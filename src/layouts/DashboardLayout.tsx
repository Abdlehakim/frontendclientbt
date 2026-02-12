import { Outlet } from "react-router-dom";
import Sidebar from "@/components/sidebar/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
