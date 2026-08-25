import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/context/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewApplication from "./pages/NewApplication";
import ApplicationDetail from "./pages/ApplicationDetail";
import Payments from "./pages/Payments";
import ContactSupport from "./pages/ContactSupport";
import Marketplace from "./pages/Marketplace";
import Balance from "./pages/Balance";
import Transfer from "./pages/Transfer";
import Escrow from "./pages/Escrow";
import DeliveryCenter from "./pages/DeliveryCenter";
import News from "./pages/News";
import Referral from "./pages/Referral";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPayments from "./pages/AdminPayments";
import AdminPricing from "./pages/AdminPricing";
import AdminChat from "./pages/AdminChat";
import AdminEscrow from "./pages/AdminEscrow";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/index" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/dashboard/balance" element={<ProtectedRoute><Balance /></ProtectedRoute>} />
              <Route path="/dashboard/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
              <Route path="/dashboard/escrow" element={<ProtectedRoute><Escrow /></ProtectedRoute>} />
              <Route path="/dashboard/delivery" element={<ProtectedRoute><DeliveryCenter /></ProtectedRoute>} />
              <Route path="/dashboard/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
              <Route path="/dashboard/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
              <Route path="/dashboard/new-application" element={<ProtectedRoute><NewApplication /></ProtectedRoute>} />
              <Route path="/dashboard/application/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
              <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/dashboard/support" element={<ProtectedRoute><ContactSupport /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
              <Route path="/admin/pricing" element={<ProtectedRoute><AdminPricing /></ProtectedRoute>} />
              <Route path="/admin/escrow" element={<ProtectedRoute><AdminEscrow /></ProtectedRoute>} />
              <Route path="/admin/chat" element={<ProtectedRoute><AdminChat /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
