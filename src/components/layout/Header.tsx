import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "@/assets/bensaude.png";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div>
            <img src={Logo} alt="Bensaúde Logo" className="h-9 w-auto" />
          </div>
        </NavLink>
        <div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
