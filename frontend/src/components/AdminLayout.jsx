import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const AdminLayout = () => (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-8 lg:px-10">
      <Outlet />
    </main>
  </div>
);
