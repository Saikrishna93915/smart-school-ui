import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Layout
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Teachers from "@/pages/Teachers";
import Attendance from "@/pages/Attendance";
import Exams from "@/pages/Exams";
import AIInsights from "@/pages/AIInsights";
import Fees from "@/pages/Fees";
import Settings from "@/pages/Settings";
import Certificates from "@/pages/Certificates";
import Communication from "@/pages/Communication";
import Syllabus from "@/pages/Syllabus";
import Transport from "@/pages/Transport";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>

              {/* ---------------- PUBLIC ROUTES ---------------- */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />

              {/* ---------------- PROTECTED DASHBOARD ROUTES ---------------- */}
              {/* DashboardLayout handles auth + sidebar + topbar */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/teachers" element={<Teachers />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/exams" element={<Exams />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/fees" element={<Fees />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route path="/communication" element={<Communication />} />
                <Route path="/syllabus" element={<Syllabus />} />
                <Route path="/transport" element={<Transport />} />
              </Route>

              {/* ---------------- FALLBACK ---------------- */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
