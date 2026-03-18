import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewApplication from "./pages/NewApplication";
import ApplicationDetail from "./pages/ApplicationDetail";
import Payments from "./pages/Payments";
import ContactSupport from "./pages/ContactSupport";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPayments from "./pages/AdminPayments";
import AdminPricing from "./pages/AdminPricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/new-application" element={<ProtectedRoute><NewApplication /></ProtectedRoute>} />
            <Route path="/dashboard/application/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/dashboard/support" element={<ProtectedRoute><ContactSupport /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/pricing" element={<ProtectedRoute><AdminPricing /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
