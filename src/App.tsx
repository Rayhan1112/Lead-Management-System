
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthLayout } from "@/components/AuthLayout";
import { AIAssistant } from "@/components/common/AIAssistant";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Agents from "./pages/Agents";
import Tasks from "./pages/Tasks";
import Meetings from "./pages/Meetings";
import Deals from "./pages/Deals";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              
              <Route path="/dashboard" element={
                <AuthLayout>
                  <Dashboard />
                </AuthLayout>
              } />
              
              <Route path="/leads" element={
                <AuthLayout>
                  <Leads />
                </AuthLayout>
              } />
              
              <Route path="/agents" element={<Agents />} />
              
              <Route path="/tasks" element={
                <AuthLayout>
                  <Tasks />
                </AuthLayout>
              } />
              
              <Route path="/meetings" element={
                <AuthLayout>
                  <Meetings />
                </AuthLayout>
              } />
              
              <Route path="/deals" element={
                <AuthLayout>
                  <Deals />
                </AuthLayout>
              } />
              
              <Route path="/settings" element={
                <AuthLayout>
                  <Settings />
                </AuthLayout>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* AI Assistant */}
            <AIAssistant />
            
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
