import { create } from 'zustand';

interface Beneficiario {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  parentesco: string;
  plano: string;
  status: 'ativo' | 'inativo' | 'suspenso';
}

interface EmpresaStats {
  totalBeneficiarios: number;
  ativosMesAtual: number;
  documentosPendentes: number;
  vidas: number;
}

interface EmpresaState {
  stats: EmpresaStats;
  beneficiarios: Beneficiario[];
  loading: boolean;
  fetchStats: () => Promise<void>;
  fetchBeneficiarios: () => Promise<void>;
}

const mockBeneficiarios: Beneficiario[] = [
  {
    id: '1',
    nome: 'Maria Silva Santos',
    cpf: '123.456.789-00',
    dataNascimento: '1985-03-15',
    parentesco: 'Titular',
    plano: 'Executivo Plus',
    status: 'ativo',
  },
  {
    id: '2',
    nome: 'José Santos Silva',
    cpf: '987.654.321-00',
    dataNascimento: '1980-07-22',
    parentesco: 'Cônjuge',
    plano: 'Executivo Plus',
    status: 'ativo',
  },
  {
    id: '3',
    nome: 'Ana Paula Costa',
    cpf: '456.789.123-00',
    dataNascimento: '1990-11-08',
    parentesco: 'Titular',
    plano: 'Standard',
    status: 'ativo',
  },
  {
    id: '4',
    nome: 'Carlos Eduardo Souza',
    cpf: '789.123.456-00',
    dataNascimento: '1975-05-30',
    parentesco: 'Titular',
    plano: 'Premium',
    status: 'inativo',
  },
];

export const useEmpresaStore = create<EmpresaState>((set) => ({
  stats: {
    totalBeneficiarios: 0,
    ativosMesAtual: 0,
    documentosPendentes: 0,
    vidas: 0,
  },
  beneficiarios: [],
  loading: false,
  fetchStats: async () => {
    set({ loading: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({
      stats: {
        totalBeneficiarios: 248,
        ativosMesAtual: 235,
        documentosPendentes: 12,
        vidas: 248,
      },
      loading: false,
    });
  },
  fetchBeneficiarios: async () => {
    set({ loading: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ beneficiarios: mockBeneficiarios, loading: false });
  },
}));
