import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // This line is already correct.
import Beneficiarios from "./pages/Beneficiarios";
import NotFound from "./pages/NotFound";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { useAuthStore } from "./store/useAuthStore";
import DocsFinaceiros from "./pages/DocsFinaceiros";
import CopartPreFatura from "./pages/CopartPreFatura";
import Documentos from "./pages/Documentos";

const queryClient = new QueryClient();

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-muted/20 to-white">
      <Sidebar />
      <div className="flex-1 pl-64">
        <Header />
        <main className="pt-20 p-8">
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </main>
      </div>
    </div>
  );
}

const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/"
              element={
                <Navigate
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  replace
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/beneficiarios"
              element={
                <ProtectedLayout>
                  <Beneficiarios />
                </ProtectedLayout>
              }
            />
            <Route
              path="/docs-financeiros"
              element={
                <ProtectedLayout>
                  <DocsFinaceiros/>
                </ProtectedLayout>
              }
            />
            <Route
              path="/copart-pre-fatura"
              element={
                <ProtectedLayout>
                  <CopartPreFatura/>
                </ProtectedLayout>
              }
            />
             <Route
              path="/docs"
              element={
                <ProtectedLayout>
                  <Documentos/>
                </ProtectedLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
