import { Profile } from "@/_enuns/Profile";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { usePermissionStore } from "@/store/permissionStore";
import { useProfileStore } from "@/store/profileStore";
import { Empresa } from "@/types";
import axios from "axios";
import { createContext, useState, useEffect, useMemo, useCallback, useContext } from "react";

interface Usuario {
  profile: string;
  cd_conta: string;
  nm_usuario: string;
  nm_operador: string;
  empresas: Empresa[];
}


interface AuthContextType {
  user: Usuario;
  // user: Usuario | null;
  // isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    companyCode: string | undefined,
    username: string,
    password: string
  ) => Promise<void>;
  logout: (showToast?: boolean) => void;

  selectedCompany: Empresa | null;
  selectCompany: (empresa: Empresa) => void;
  // verificaCPF: (cpf: number) => Promise<CPFVerificationResponse | null>;
  // register: (cpf: number, senha: string) => Promise<boolean>;
  // createAccount: (cpf: number) => Promise<boolean>;
  // registerContact: (
  //   cpf: number,
  //   type: "phone" | "email",
  //   contact: string
  // ) => Promise<boolean>;
  // confirmContact: (
  //   cpf: number,
  //   type: "phone" | "email",
  //   contact: string,
  //   token: string
  // ) => Promise<boolean>;
  // resendSMS: (cpf: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);


  const login = useCallback(async (companyCode: string, username: string, password: string) => {
    try {

      setLoading(true)
      // Requisição de login

      // DADOS de teste
      const userData = {
        id: '1',
        profile: 'admin',
        name: 'Admin Bensaúde',
        username: 'admin',
        role: 'admin',
        empresas: [
          {
            cd_empresa: '1',
            nm_fantasia: 'Empresa Principal',
            ds_razao_social: 'Empresa Principal S.A.',
            nr_cnpj: '11.222.333/0001-44',

            // logradouro: 'Av. Principal, 123',
            // bairro: 'Centro',
            // cidade: 'São Paulo, SP',
            // email: 'contato@principal.com.br',
            // site: 'www.principal.com.br',

            sn_ativo: 'S'
          },
          { cd_empresa: '2', nm_fantasia: 'Empresa Secundária', ds_razao_social: 'Secundária Ltda.', nr_cnpj: '55.666.777/0001-88', sn_ativo: 'S' },
          { cd_empresa: '3', nm_fantasia: 'Empresa Terciária', ds_razao_social: 'Terciária S/A', nr_cnpj: '99.888.777/0001-11', sn_ativo: 'S' },
        ],
      }

    // cd_plano: number,
    // cd_empresa_mv: number,
    // cd_empresa_pai: number

      // Pegar os dados da emprsa
      // const cod_teste = 3200
      // const { data } = await api.get(`/Empresa`, {
      //   params: {
      //     page: 1,
      //     pageSize: 20,
      //     CdPlano: cod_teste,
      //   },
      // });

      // const empresa: Empresa = data.data[0];

      // const { data: childrenData } = await api.get(`/Empresa`, {
      //   params: {
      //     page: 1,
      //     pageSize: 20,
      //     CdEmpresaPai: empresa.cd_empresa,
      //   },
      // });

      // const empresas = [...childrenData.data, empresa];
      // selectCompany(empresas)

      // Montar o store de Perfil
      useProfileStore.getState().setProfile({ id: 1, perfil: 'COMERCIAL' });

      // // Montar o store de Permissões
      // await usePermissionStore.getState().loadPermissions()

      setUser(userData)
      selectCompany(userData.empresas[0])

    } catch (error: unknown) {

      // Erro desconhecido;
      let errorTitle = "Operação negada.";
      let errorDescription = "Ocorreu um erro inesperado. Tente novamente mais tarde.";

      // Erro de requisição;
      if (axios.isAxiosError(error)) {
        errorDescription = "Não foi possível concluir a ação. Verifique os dados e tente novamente."
        console.log("Erro de requisição:", error.response?.data);
      }

      // Erro tratados;
      if (error instanceof Error) {
        errorDescription = "Essa operação não pode ser realizada no momento."
        console.log("Erro manual:", error.message);
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });

      throw error;
    } finally {
      setLoading(false)
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("@user");
    setSelectedCompany(null)
  }, []);

  const selectCompany = (company: any) => {
    setSelectedCompany(company);
  };


  const value = useMemo(() => ({
    user,
    selectedCompany,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    selectCompany
  }), [user, selectedCompany, loading, login, logout, selectCompany]);


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
