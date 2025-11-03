import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Company {
  id: string;
  name: string;
  razaoSocial?: string;
  logradouro?: string;
  cnpj?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  email?: string;
  site?: string;
}

interface User {
  profile: string;
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'user';
  companies: Company[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  selectedCompany: Company | null;
  login: (companyCode: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectCompany: (company: Company) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      selectedCompany: null,
      login: async (companyCode: string, username: string, password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (username === 'admin' && password === '123456' && companyCode === '123') {
          const userData: User = {
            id: '1',
            profile: 'admin',
            name: 'Admin Bensaúde',
            username: 'admin',
            role: 'admin',
            companies: [
              {
                id: '1',
                name: 'Empresa Principal',
                razaoSocial: 'Empresa Principal S.A.',
                cnpj: '11.222.333/0001-44',
                logradouro: 'Av. Principal, 123',
                bairro: 'Centro',
                cidade: 'São Paulo, SP',
                email: 'contato@principal.com.br',
                site: 'www.principal.com.br',
              },
              { id: '2', name: 'Empresa Secundária', razaoSocial: 'Secundária Ltda.', cnpj: '55.666.777/0001-88' },
              { id: '3', name: 'Empresa Terciária', razaoSocial: 'Terciária S/A', cnpj: '99.888.777/0001-11' },
            ],
          };
          set({
            user: userData,
            isAuthenticated: true,
            selectedCompany: userData.companies[0],
          });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, selectedCompany: null });
      },
      selectCompany: (company: Company) => {
        set({ selectedCompany: company });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
