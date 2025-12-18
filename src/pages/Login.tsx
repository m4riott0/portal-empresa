import { useState, forwardRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building, User, Lock, ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import LoginHero from "@/assets/login-hero.png";
import Logo from "@/assets/bensaude.png";
import { usePermissionStore } from "@/store/permissionStore";

// Subcomponente para os inputs do formulário, promovendo reutilização e limpeza do código.
interface LoginInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: LucideIcon;
}

const LoginInput = ({ id, label, icon: Icon, ...props }: LoginInputProps) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</Label>
    <div className="relative"><Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id={id} className="pl-12 input-medical h-14 text-base" {...props} /></div>
  </div>
);

export default function Login() {
  const [companyCode, setCompanyCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(companyCode, username, password);
      if (success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        });

        setTimeout(() => navigate("/dashboard"), 500);
      } else {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: "Credenciais inválidas. Tente novamente.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao fazer login.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-muted/30 to-white">
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo */}
          <div className="flex flex-col items-center space-y-3">
            <img src={Logo} alt="Bensaúde Logo" className="h-12 w-auto lg:hidden" />
          </div>

          {/* Welcome Text */}
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-bold text-foreground">Bem-vindo de volta!</h2>
            <p className="text-base text-muted-foreground">Acesse sua conta para gerenciar benefícios de saúde da sua empresa</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <LoginInput
                id="companyCode"
                label="Código da Empresa"
                icon={Building}
                type="text"
                placeholder="Digite o código"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                required
              />
              <LoginInput
                id="username"
                label="Usuário"
                icon={User}
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <LoginInput
                id="password"
                label="Senha"
                icon={Lock}
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="btn-medical w-full h-14 text-base group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                <>
                  Acessar Plataforma
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            <Link
              to="/recuperar-senha"
              // state={{ cpf }}
              className="text-sm text-primary hover:text-primary-hover transition-colors block"
            >
              Esqueceu sua senha?
            </Link>           

          </form>
        </motion.div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src={LoginHero} 
          alt="Profissionais de saúde da Bensaúde sorrindo"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
