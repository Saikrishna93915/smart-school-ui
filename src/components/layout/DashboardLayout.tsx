import { Navigate, Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    // overflow-hidden is mandatory here to prevent the whole page from shifting
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <TopBar />
        {/* Only this main section should scroll */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}