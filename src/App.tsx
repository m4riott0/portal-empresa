import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { AuthProvider, useAuth } from "./contexts/AuthContext";


// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // This line is already correct.
import Beneficiarios from "./pages/Beneficiarios";
import NotFound from "./pages/NotFound";
import DocsFinaceiros from "./pages/DocsFinaceiros";
import CopartPreFatura from "./pages/CopartPreFatura";
import Documentos from "./pages/Documentos";
import PermissaoPerfil from "./pages/PermissaoPerfil";
import PasswordRecovery from "./pages/PasswordRecovery";
import Empresas from "./pages/Empresas";
import Usuarios from "./pages/Usuarios";
import PrivateRoute from "./components/PrivateRoute";

const queryClient = new QueryClient();

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-muted/20 to-white">
      <Sidebar />

      <div className="flex-1 pl-64">
        <Header />

        <main className="pt-20 p-8">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

const App = () => {
  // const { isAuthenticated } = useAuth();
  // 
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* <Route path="/" element={
                <Navigate
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  replace
                />
              }
              /> */}
              <Route path="/recuperar-senha" element={<PasswordRecovery />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/beneficiarios" element={<Beneficiarios />} />
                  <Route path="/docs-financeiros" element={<DocsFinaceiros />} />
                  <Route path="/copart-pre-fatura" element={<CopartPreFatura />} />
                  <Route path="/docs" element={<Documentos />} />
                  <Route path="/permissao_perfil" element={<PermissaoPerfil />} />
                  <Route path="/empresas" element={<Empresas />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider >
  );
};

export default App;
