import { useEffect, useState, useMemo, useCallback, MouseEventHandler } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Company, useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { Label, Label as FormLabel } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";import { Search, UserPlus, Pencil, Trash2, Loader2, FileDown, FileUp, FileSearch, Users, EllipsisVertical, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";

// --- TIPOS E SCHEMAS ---
type Beneficiario = {
  id: number;
  nome: string;
  sexo?: 'Masculino' | 'Feminino';
  dataNascimento?: string;
  rg?: string;
  orgaoEmissor?: string;
  cpf?: string;
  nacionalidade?: string;
  nomeMae?: string;
  estadoCivil?: 'Solteiro' | 'Casado' | 'Divorciado' | 'Viúvo';
  telefone?: string;
  email?: string;
  profissao?: string;
  cns?: string;
  dataAdmissao?: string;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
  statusUsuario: 'Ativo' | 'Cancelado' | 'A Cadastrar';
  statusDocumento: 'Aprovado' | 'Negado' | 'Suspenso';
  dependentes: Dependente[];
  cnpj: string;
  nomeEmpresa: string;
  plano?: { adesao?: boolean; inicioVigencia?: string; cobertura?: string; }; 
};

type Dependente = {
  id: number;
  nome: string;
  grauParentesco: string;
  dataNascimento: string;
  cpf: string;
  status: 'Ativo' | 'Suspenso';
};

// Schema de validação com Zod para o formulário de beneficiário
const beneficiarioSchema = z.object({
  nome: z.string().min(3, { message: "O nome completo é obrigatório." }),
  cpf: z.string().min(11, { message: "CPF inválido." }).max(14, { message: "CPF inválido."}), 
  dataNascimento: z.string().min(1, { message: "Data de nascimento é obrigatória." }),
  sexo: z.enum(['Masculino', 'Feminino'], { required_error: "Selecione o sexo." }),
  nomeMae: z.string().min(3, { message: "Nome da mãe é obrigatório." }),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  telefone: z.string().optional(),
  rg: z.string().optional(),
  orgaoEmissor: z.string().optional(),
  nacionalidade: z.string().optional(),
  estadoCivil: z.enum(['Solteiro', 'Casado', 'Divorciado', 'Viúvo']).optional(),
  profissao: z.string().optional(),
  cns: z.string().optional(),
  dataAdmissao: z.string().optional(),
  endereco: z.object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().optional(),
  }).optional(),
  plano: z.object({
    adesao: z.boolean().optional(), // Adesao é opcional no Zod, alinhado com o tipo Beneficiario
    inicioVigencia: z.string().min(1, { message: "Início da vigência é obrigatório." }),
    cobertura: z.string({ required_error: "Selecione a cobertura." }),
  }).optional(),
});

// Inferir o tipo do formulário a partir do schema do Zod
type BeneficiarioFormData = z.infer<typeof beneficiarioSchema>;

// Schema de validação com Zod para o formulário de dependente
const dependenteSchema = z.object({
  nome: z.string().min(3, { message: "O nome completo é obrigatório." }),
  sexo: z.enum(['Feminino', 'Masculino'], { required_error: "Selecione o sexo." }),
  grauParentesco: z.string().min(1, { message: "Grau de parentesco é obrigatório." }),
  estadoCivil: z.enum(['Solteiro', 'Casado', 'Divorciado', 'Viúvo'], { required_error: "Estado civil é obrigatório." }),
  dataNascimento: z.string().min(1, { message: "Data de nascimento é obrigatória." }),
  cpf: z.string().min(11, { message: "CPF inválido." }).max(14, { message: "CPF inválido."}),
  rg: z.string().optional(),
  orgaoEmissor: z.string().optional(),
  nacionalidade: z.string().optional(),
  nomeMae: z.string().min(3, { message: "Nome da mãe é obrigatório." }),
  profissao: z.string().optional(),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  telefone: z.string().optional(),
  cns: z.string().optional(),
  motivoDependencia: z.string().min(1, { message: "Motivo de dependência é obrigatório." }),
  inicioDependencia: z.string().min(1, { message: "Início da dependência é obrigatório." }),
  plano: z.object({
    adesao: z.boolean().default(true),
    inicioVigencia: z.string().min(1, { message: "Início da vigência é obrigatório." }),
    cobertura: z.string({ required_error: "Selecione a cobertura." }),
  }),
});

type DependenteFormData = z.infer<typeof dependenteSchema>;

// --- DADOS MOCKADOS PARA PROTÓTIPO ---
// Em um ambiente real, estes dados viriam da API.
const mockBeneficiarios: Beneficiario[] = [
  { 
    id: 1, nome: 'João da Silva', cpf: '123.456.789-01', statusUsuario: 'Ativo', statusDocumento: 'Aprovado', 
    dependentes: [{id: 101, nome: 'Ana Silva', grauParentesco: 'Cônjuge', dataNascimento: '1985-05-20', cpf: '111.222.333-44', status: 'Ativo'}, {id: 102, nome: 'Pedro Silva', grauParentesco: 'Filho', dataNascimento: '2010-10-15', cpf: '222.333.444-55', status: 'Ativo'}], 
    cnpj: '11.222.333/0001-44', nomeEmpresa: 'Empresa A',
    plano: { inicioVigencia: '2023-01-15' }
  },
  { 
    id: 2, nome: 'Maria Oliveira', cpf: '987.654.321-09', statusUsuario: 'Cancelado', statusDocumento: 'Negado', 
    dependentes: [], 
    cnpj: '11.222.333/0001-44', nomeEmpresa: 'Empresa A',
    plano: { inicioVigencia: '2022-11-01' }
  },
  { 
    id: 3, nome: 'Carlos Pereira', cpf: '555.666.777-88', statusUsuario: 'A Cadastrar', statusDocumento: 'Suspenso', 
    dependentes: [{id: 103, nome: 'Mariana Pereira', grauParentesco: 'Filha', dataNascimento: '2015-02-28', cpf: '333.444.555-66', status: 'Suspenso'}], 
    cnpj: '44.555.666/0001-77', nomeEmpresa: 'Empresa B',
    plano: { inicioVigencia: '2024-03-10' }
  },
];

type ModalState =
  | { type: 'import' }
  | { type: 'edit'; beneficiario: Beneficiario; defaultTab: 'titular' | 'dependentes' }
  | { type: 'delete'; beneficiario: Beneficiario }
  | null;

export default function Beneficiarios() {
  // --- ESTADOS DO COMPONENTE ---
  const { user, selectedCompany, selectCompany } = useAuthStore();
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<{ usuario: string[] }>({ usuario: [] });
  const [modalState, setModalState] = useState<ModalState>(null);
  const [addingDependentTo, setAddingDependentTo] = useState<Beneficiario | null>(null);
  const { toast } = useToast();
  const [loadingFichaId, setLoadingFichaId] = useState<number | null>(null);
  
  // Estados para o modal de importação
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- EFEITOS ---
  // Busca os beneficiários sempre que a empresa selecionada mudar.
  const fetchBeneficiarios = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedCompany) {
        // Busca para uma empresa específica
        console.log(`Buscando beneficiários para a empresa: ${selectedCompany.name}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simula o delay da API
        setBeneficiarios(mockBeneficiarios.filter(b => b.cnpj === selectedCompany.cnpj));
      } else if (user?.profile === 'cadastro') {
        // Busca para todas as empresas (perfil cadastro)
        console.log(`Buscando beneficiários para todas as empresas.`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setBeneficiarios(mockBeneficiarios); // Em um caso real, a API retornaria todos
      } else {
        setBeneficiarios([]);
      }
    } catch (error) {
      console.error("Erro ao buscar beneficiários:", error);
      toast({ variant: "destructive", title: "Erro ao buscar beneficiários." });
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, toast, user?.profile]);

  useEffect(() => {
    // Para o perfil de cadastro, começa com "todas as empresas"
    // A verificação 'selectedCompany' evita um loop de renderização infinito.
    if (user?.profile === 'cadastro' && selectedCompany) {
      selectCompany(null);
    } else if (user?.companies.length === 1) {
      selectCompany(user.companies[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profile]);

  useEffect(() => {
    fetchBeneficiarios();
  }, [fetchBeneficiarios]);

  // --- MEMOIZAÇÃO E FILTROS ---
  // Filtra os beneficiários com base na busca por nome e nos filtros de status.
  const filteredBeneficiarios = useMemo(() => {
    return beneficiarios.filter(b => {
      const nameMatch = b.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const statusUsuarioMatch = statusFilters.usuario.length === 0 || statusFilters.usuario.includes(b.statusUsuario);
      return nameMatch && statusUsuarioMatch;
    });
  }, [beneficiarios, searchTerm, statusFilters]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredBeneficiarios.length / itemsPerPage);
  }, [filteredBeneficiarios.length, itemsPerPage]);

  const paginatedBeneficiarios = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBeneficiarios.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBeneficiarios, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilters, selectedCompany]);

  // --- HANDLERS DE EVENTOS ---
  const handleCompanyChange = (companyId: string) => {
    if (!companyId) {
      selectCompany(null);
      return;
    }
    const company = user?.companies.find(c => c.id === companyId);
    if (company) {
      selectCompany(company);
    }
  };

  // Salva (cria ou atualiza) um beneficiário.
  const handleSave = async (data: Beneficiario) => {
    // A lógica aqui deve ser substituída pela chamada à sua API real.
    try {
      if (data.id) { // Atualização
        // TODO: Substituir a simulação abaixo pela chamada de API real para ATUALIZAR.
        // Ex: await api.updateBeneficiario(data.id, data);
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({ title: "Beneficiário atualizado com sucesso!" });
      } else { // Criação
        const newBeneficiario = { ...data, id: Date.now() }; // Simula ID gerado pela API
        // TODO: Substituir a simulação abaixo pela chamada de API real para CRIAR.
        // Ex: const created = await api.createBeneficiario(newBeneficiario);
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({ title: "Novo funcionário adicionado com sucesso!" });
      }
      fetchBeneficiarios(); // Re-busca os dados para garantir consistência
      return true; // Indica sucesso
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar beneficiário." });
      return false; // Indica falha
    }
  };

  // Deleta um beneficiário.
  const handleDelete = async (id: number) => {
    try {
      // TODO: Substituir a simulação abaixo pela chamada de API real para DELETAR.
      // Ex: await api.deleteBeneficiario(id);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simula o delay da API
      toast({ variant: "destructive", title: "Beneficiário removido com sucesso!" });
      fetchBeneficiarios(); // Re-busca os dados para garantir consistência
    } catch (error) {
      console.error("Erro ao remover beneficiário:", error);
      toast({ variant: "destructive", title: "Erro ao remover beneficiário." });
    }
  };

  // Abre o modal para edição, preenchendo com os dados existentes.
  const openManageModal = (beneficiario: Beneficiario, tab: "titular" | "dependentes" = "titular") => {
    setModalState({ type: 'edit', beneficiario, defaultTab: tab });
  };

  const openAddDependentModal = (beneficiario: Beneficiario) => {
    // Este modal é aninhado, então não fecha o modal pai (BeneficiarioFormDialog)
    setAddingDependentTo(beneficiario);
  };

  const openDeleteModal = (beneficiario: Beneficiario) => {
    setModalState({ type: 'delete', beneficiario });
  };

  // Lida com a mudança nos checkboxes de filtro.
  const handleFilterChange = (type: 'usuario', value: string, checked: boolean) => {
    setStatusFilters(prev => {
      const currentFilters = new Set(prev[type]);
      if (checked) {
        currentFilters.add(value);
      } else {
        currentFilters.delete(value);
      }
      return { ...prev, [type]: Array.from(currentFilters) };
    });
  };

  // Visualiza a ficha (PDF) de um beneficiário.
  const handleVisualizarFicha = async (beneficiario: Beneficiario) => {
    setLoadingFichaId(beneficiario.id);
    try {
      // TODO: Substituir a simulação abaixo pela chamada de API real para buscar o PDF.
      // Ex: const pdfBlob = await api.getFichaBeneficiario(beneficiario.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula o delay da API

      // Simulação de um blob de PDF. A API real deve retornar algo similar.
      const fakePdfContent = `Simulação de PDF para: ${beneficiario.nome}`;
      const pdfBlob = new Blob([fakePdfContent], { type: 'application/pdf' });

      // Cria uma URL para o Blob e abre em uma nova aba
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      URL.revokeObjectURL(pdfUrl); // Libera a memória após a abertura

      toast({ title: "Ficha gerada com sucesso!" });
    } catch (error) {
      console.error("Erro ao visualizar a ficha:", error);
      toast({ variant: "destructive", title: "Erro ao gerar a ficha do beneficiário." });
    } finally {
      setLoadingFichaId(null);
    }
  };

  // Exporta o template CSV para importação
  const handleExportTemplate = () => {
    const headers = [
      "nome", "cpf", "dataNascimento", "sexo", "nomeMae", "email", "telefone", "rg", "orgaoEmissor", "nacionalidade", "estadoCivil", "profissao", "cns", "dataAdmissao"
    ];
    const csvContent = headers.join(';');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_beneficiarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Processa o arquivo CSV importado
  const handleProcessImport = async () => {
    if (!importFile) {
      toast({ variant: "destructive", title: "Nenhum arquivo selecionado." });
      return;
    }
    if (!selectedCompany) {
      toast({ variant: "destructive", title: "Nenhuma empresa selecionada." });
      return;
    }

    setIsProcessingImport(true);
    setImportResult(null);

    // Simulação de processamento de arquivo
    await new Promise(resolve => setTimeout(resolve, 1500));

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r\n|\n/);
      const headers = lines[0].split(';').map(h => h.trim());
      const expectedHeaders = ["nome", "cpf", "dataNascimento", "sexo", "nomeMae"]; // Apenas um exemplo de validação

      if (!expectedHeaders.every(h => headers.includes(h))) {
        setImportResult({ success: 0, errors: ["O arquivo não corresponde ao modelo esperado. Verifique os cabeçalhos."] });
        setIsProcessingImport(false);
        return;
      }

      const newBeneficiarios: Beneficiario[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const data = lines[i].split(';');
        const beneficiarioData: any = {};
        headers.forEach((header, index) => {
          beneficiarioData[header] = data[index];
        });

        // TODO: Adicionar validação mais robusta aqui (usando Zod, por exemplo)
        if (!beneficiarioData.nome || !beneficiarioData.cpf) {
          errors.push(`Linha ${i + 1}: Nome e CPF são obrigatórios.`);
          continue;
        }

        newBeneficiarios.push({
          ...beneficiarioData,
          id: Date.now() + i, // ID simulado
          statusUsuario: 'A Cadastrar', statusDocumento: 'Suspenso', dependentes: 0, cnpj: selectedCompany.cnpj, nomeEmpresa: selectedCompany.name
        });
      }
      
      // TODO: Enviar 'newBeneficiarios' para a API
      setBeneficiarios(prev => [...prev, ...newBeneficiarios]);
      setImportResult({ success: newBeneficiarios.length, errors });
      setIsProcessingImport(false);
      toast({ title: "Importação processada!", description: `${newBeneficiarios.length} funcionários adicionados.` });
      // Não fecha o modal automaticamente para que o usuário veja o resultado
    };
    reader.readAsText(importFile);
  };

  // Abre o modal para um novo beneficiário, com dados padrão.
  const openNewModal = () => {
    const newBeneficiario: Beneficiario = {
      id: 0,
      nome: "",
      cpf: "",
      dataNascimento: "",
      sexo: undefined,
      rg: "",
      orgaoEmissor: "",
      nacionalidade: "BRASIL",
      nomeMae: "",
      estadoCivil: undefined,
      telefone: "",
      email: "",
      profissao: "",
      cns: "",
      dataAdmissao: "",
      endereco: {},
      statusUsuario: 'A Cadastrar',
      statusDocumento: 'Suspenso',
      dependentes: [],
      plano: {
        adesao: true,
        inicioVigencia: "",
        cobertura: undefined,
      },
      cnpj: selectedCompany?.cnpj || '',
      nomeEmpresa: selectedCompany?.name || '',
    };
    setModalState({ type: 'edit', beneficiario: newBeneficiario, defaultTab: 'titular' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Pesquisa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {user && (user.profile === 'cadastro' || user.companies.length > 1) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa</label>
                <Select onValueChange={handleCompanyChange} value={selectedCompany?.id || ''}>
                  <SelectTrigger><SelectValue placeholder="Visualizando todas as empresas..." /></SelectTrigger>
                  <SelectContent>
                    {user?.profile === 'cadastro' && (
                      <SelectItem value=''>Ver todas as empresas</SelectItem>
                    )}
                    {user?.companies.map(company => (<SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Usuário</label>
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2"><Checkbox id="status-ativo" onCheckedChange={(c) => handleFilterChange('usuario', 'Ativo', !!c)} /><label htmlFor="status-ativo">Ativo</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="status-cancelado" onCheckedChange={(c) => handleFilterChange('usuario', 'Cancelado', !!c)} /><label htmlFor="status-cancelado">Cancelado</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="status-cadastrar" onCheckedChange={(c) => handleFilterChange('usuario', 'A Cadastrar', !!c)} /><label htmlFor="status-cadastrar">A Cadastrar</label></div>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="search-beneficiario" className="text-sm font-medium">Campo de busca</label>
              <Input id="search-beneficiario" placeholder="Digite o nome do beneficiário..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-4 mt-4 border-t">
              <Button variant="outline" onClick={handleExportTemplate}><FileDown className="mr-2 h-4 w-4" /> Exportar Modelo (Planilha)</Button>
              
              {/* --- INÍCIO: MODAL DE IMPORTAÇÃO --- */}
              <Dialog open={modalState?.type === 'import'} onOpenChange={(isOpen) => !isOpen && setModalState(null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => { setModalState({ type: 'import' }); setImportFile(null); setImportResult(null); }}><FileUp className="mr-2 h-4 w-4" /> Importar Funcionários (Planilha)</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Importar Funcionários em Massa</DialogTitle>
                    <DialogDescription>
                      Selecione um arquivo de planilha para adicionar novos funcionários. Use o modelo exportado para garantir o formato correto.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)} disabled={isProcessingImport} />
                    {importResult && (
                      <div className="mt-4 p-4 border rounded-md bg-muted/50 text-sm">
                        <p className="font-semibold">Resultado da Importação:</p>
                        <p className="text-blue-600">{importResult.success} registros importados com sucesso.</p>
                        {importResult.errors.length > 0 && (
                          <>
                            <p className="text-red-600 mt-2">{importResult.errors.length} erros encontrados:</p>
                            <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                              {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setModalState(null)} disabled={isProcessingImport}>Fechar</Button>
                    <Button onClick={handleProcessImport} disabled={!importFile || isProcessingImport}>
                      {isProcessingImport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isProcessingImport ? "Processando..." : "Processar Arquivo"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* --- FIM: MODAL DE IMPORTAÇÃO --- */}

            <Button className="btn-medical" onClick={openNewModal}><UserPlus className="mr-2 h-4 w-4" /> Novo Funcionário</Button>

          </div>
        </CardContent>
      </Card>

      {/* Tabela de Beneficiários */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Beneficiários</CardTitle>
          <CardDescription>Lista de todos os beneficiários associados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>{loading ? "Carregando..." : `Exibindo ${paginatedBeneficiarios.length} de ${filteredBeneficiarios.length} beneficiários encontrados.`}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">Beneficiário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-center">Dependentes</TableHead>
                {user?.profile === 'cadastro' && !selectedCompany && <TableHead>Empresa</TableHead>}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (<TableRow><TableCell colSpan={6} className="text-center h-24">Carregando beneficiários...</TableCell></TableRow>) :
                paginatedBeneficiarios.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.nome}</div>
                      <div className="text-xs text-muted-foreground">{b.cpf}</div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        b.statusUsuario === 'Ativo' ? 'bg-blue-100 text-blue-800' : 
                        b.statusUsuario === 'Cancelado' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {b.statusUsuario === 'Ativo' && <CheckCircle className="h-3 w-3" />}
                        {b.statusUsuario === 'Cancelado' && <XCircle className="h-3 w-3" />}
                        {b.statusUsuario === 'A Cadastrar' && <HelpCircle className="h-3 w-3" />}
                        {b.statusUsuario}
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.plano?.inicioVigencia ? new Date(b.plano.inicioVigencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">{b.dependentes.length}</TableCell>
                    {user?.profile === 'cadastro' && !selectedCompany && (
                      <TableCell>{b.nomeEmpresa}</TableCell>)}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <EllipsisVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleVisualizarFicha(b)} disabled={loadingFichaId === b.id}>
                            {loadingFichaId === b.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                            Visualizar Ficha
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openManageModal(b, 'titular')}>
                            <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                            Editar Titular
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => openManageModal(b, 'dependentes')}>
                            <Users className="mr-2 h-4 w-4 text-purple-500" />
                            <span>Gerenciar Dependentes ({b.dependentes.length})</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openAddDependentModal(b)}>
                            <UserPlus className="mr-2 h-4 w-4 text-blue-500" />
                            Adicionar Dependente
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => openDeleteModal(b)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
        {/* Modais controlados por estado */}
        {modalState?.type === 'edit' && <BeneficiarioFormDialog key={modalState.beneficiario.id} beneficiario={modalState.beneficiario} onSave={handleSave} defaultTab={modalState.defaultTab} onOpenChange={(isOpen) => !isOpen && setModalState(null)} />}
        {addingDependentTo && <DependenteFormDialog titular={addingDependentTo} onSave={() => { console.log("salvando dependente"); return Promise.resolve(true); }} onOpenChange={(isOpen) => !isOpen && setAddingDependentTo(null)} />}
        {/* --- INÍCIO: MODAL DE EXCLUSÃO --- */}
        {modalState?.type === 'delete' && (
          <Dialog open={modalState?.type === 'delete'} onOpenChange={(isOpen) => !isOpen && setModalState(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir o beneficiário "{modalState.beneficiario.nome}"? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-start">
                <Button variant="outline" onClick={() => setModalState(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => { handleDelete(modalState.beneficiario.id); setModalState(null); }}>Excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {/* --- FIM: MODAL DE EXCLUSÃO --- */}
        {totalPages > 1 && (
          <CardFooter>
            <Pagination className="mt-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >Anterior</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >Próximo</Button>
              </div>
            </Pagination>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// --- INÍCIO: COMPONENTE MODAL FORMULÁRIO BENEFICIÁRIO ---
interface BeneficiarioFormDialogProps {
  beneficiario: Beneficiario; // Dados para edição ou valores padrão para criação
  onSave: (data: Beneficiario) => Promise<boolean>; // Função que salva e retorna se teve sucesso
  onOpenChange: (isOpen: boolean) => void;
  defaultTab?: "titular" | "dependentes";
}
function BeneficiarioFormDialog({ beneficiario, onSave, onOpenChange, defaultTab = "titular" }: BeneficiarioFormDialogProps) {
  const [termoAceite, setTermoAceite] = useState(false);
  const { toast } = useToast(); 
  const [isDependenteDialogOpen, setIsDependenteDialogOpen] = useState(false);

  // Configuração do react-hook-form para o titular
  const form = useForm<BeneficiarioFormData>({
    resolver: zodResolver(beneficiarioSchema),
    defaultValues: {
      nome: beneficiario.nome || "",
      cpf: beneficiario.cpf || "",
      dataNascimento: beneficiario.dataNascimento || "",
      sexo: beneficiario.sexo,
      rg: beneficiario.rg || "",
      orgaoEmissor: beneficiario.orgaoEmissor || "",
      nacionalidade: beneficiario.nacionalidade || "BRASIL",
      nomeMae: beneficiario.nomeMae || "",
      estadoCivil: beneficiario.estadoCivil,
      telefone: beneficiario.telefone || "",
      email: beneficiario.email || "",
      profissao: beneficiario.profissao || "",
      cns: beneficiario.cns || "",
      dataAdmissao: beneficiario.dataAdmissao || "",
      endereco: {
        ...beneficiario.endereco
      },
      plano: beneficiario.plano ? {
        adesao: beneficiario.plano.adesao ?? true, // Garante que 'adesao' tenha um valor booleano
        inicioVigencia: beneficiario.plano?.inicioVigencia || "",
        cobertura: beneficiario.plano?.cobertura,
      } : undefined,
    },
  });

  // Função de submissão do formulário
  const onSubmit = async (data: BeneficiarioFormData) => {
    const fullData = { ...beneficiario, ...data };
    const success = await onSave(fullData);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleSaveDependente = async (data: DependenteFormData) => {
    console.log("Salvando novo dependente para o titular:", beneficiario.nome, data);
    // TODO: Implementar chamada de API para salvar o dependente
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: "Dependente adicionado com sucesso!" });
    setIsDependenteDialogOpen(false); // Fecha o modal de dependente
    // Idealmente, você re-buscaria os dados do beneficiário aqui para atualizar a lista de dependentes
    return true;
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
      <DialogHeader><DialogTitle>{beneficiario.id ? 'Editar Beneficiário' : 'Novo Funcionário'}</DialogTitle></DialogHeader>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="titular">Dados do Titular</TabsTrigger>
          <TabsTrigger value="dependentes">Dependentes ({beneficiario.dependentes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="titular">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              <Card>
                <CardHeader><CardTitle>1. Informações Pessoais</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField control={form.control} name="nome" render={({ field }) => (<FormItem className="lg:col-span-2"><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="sexo" render={({ field }) => (<FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="dataNascimento" render={({ field }) => (<FormItem><FormLabel>Data de Nascimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="rg" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="orgaoEmissor" render={({ field }) => (<FormItem><FormLabel>Órgão Emissor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="nacionalidade" render={({ field }) => (<FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="estadoCivil" render={({ field }) => (<FormItem><FormLabel>Estado Civil</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Solteiro">Solteiro(a)</SelectItem><SelectItem value="Casado">Casado(a)</SelectItem><SelectItem value="Divorciado">Divorciado(a)</SelectItem><SelectItem value="Viúvo">Viúvo(a)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="nomeMae" render={({ field }) => (<FormItem className="lg:col-span-3"><FormLabel>Nome da Mãe</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="telefone" render={({ field }) => (<FormItem><FormLabel>Telefone / Celular</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="profissao" render={({ field }) => (<FormItem><FormLabel>Profissão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>3. Plano de Saúde</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                  <FormField control={form.control} name="plano.adesao" render={({ field }) => (<FormItem className="flex items-center space-x-2 pt-6"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Adesão ao Plano</FormLabel></FormItem>)} />
                  <FormField control={form.control} name="plano.inicioVigencia" render={({ field }) => (<FormItem><FormLabel>Início da Vigência</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="plano.cobertura" render={({ field }) => (<FormItem><FormLabel>Cobertura</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="1">1 - Enfermaria</SelectItem><SelectItem value="2">2 - Apartamento</SelectItem><SelectItem value="3">3 - VIP</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>4. Termo de Aceite</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    A vigência para inclusões, exclusões ou alterações de plano seguirá o cronograma acordado com a sua empresa.
                    Consulte o RH para mais detalhes sobre os prazos.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="termo-aceite" checked={termoAceite} onCheckedChange={(checked) => setTermoAceite(Boolean(checked))} />
                    <Label htmlFor="termo-aceite" className="text-sm font-normal">
                      Li e concordo com as condições citadas acima. (Data de Vigência dessa operação: 01/01/2025)
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <DialogFooter>
                <div className="flex-grow">
                  <Button type="button" variant="secondary" onClick={() => alert('Gerando declaração... (simulação)')}>Declaração</Button>
                </div>
                
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar Edição</Button>
                
                <Button type="submit" disabled={!termoAceite || form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar Registro"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="dependentes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Dependentes de {beneficiario.nome}</CardTitle>
                <Dialog open={isDependenteDialogOpen} onOpenChange={setIsDependenteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><UserPlus className="mr-2 h-4 w-4" /> Adicionar Dependente</Button>
                  </DialogTrigger>
                  {isDependenteDialogOpen && <DependenteFormDialog titular={beneficiario} onSave={handleSaveDependente} onOpenChange={setIsDependenteDialogOpen} />}
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Parentesco</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiario.dependentes.length > 0 ? (
                    beneficiario.dependentes.map(dep => (
                      <TableRow key={dep.id}>
                        <TableCell className="font-medium">{dep.nome}</TableCell>
                        <TableCell>{dep.grauParentesco}</TableCell>
                        <TableCell>{dep.cpf}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            dep.status === 'Ativo' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {dep.status === 'Ativo' ? <CheckCircle className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
                            {dep.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum dependente cadastrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </DialogContent>
    </Dialog>
  );
}
// --- FIM: COMPONENTE MODAL FORMULÁRIO BENEFICIÁRIO ---

// --- INÍCIO: COMPONENTE MODAL FORMULÁRIO DEPENDENTE ---
interface DependenteFormDialogProps {
  titular: Beneficiario;
  onSave: (data: DependenteFormData) => Promise<boolean>;
  onOpenChange: (isOpen: boolean) => void;
}
function DependenteFormDialog({ titular, onSave, onOpenChange }: DependenteFormDialogProps) {
  const form = useForm<DependenteFormData>({
    resolver: zodResolver(dependenteSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      dataNascimento: "",
      sexo: undefined,
      rg: "",
      orgaoEmissor: "",
      nacionalidade: "BRASIL",
      nomeMae: "",
      estadoCivil: undefined,
      telefone: "",
      email: "",
      profissao: "",
      cns: "",
      grauParentesco: "",
      motivoDependencia: "",
      inicioDependencia: "",
      plano: {
        adesao: true,
        inicioVigencia: "",
        cobertura: undefined,
      },
    },
  });

  const onSubmit = async (data: DependenteFormData) => {
    console.log("Salvando dependente:", data);
    const success = await onSave(data);
    // O fechamento do modal é tratado pelo onSave no componente pai
    // ou pelo onOpenChange
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
        <DialogTitle>Adicionar Dependente</DialogTitle>
        <DialogDescription>
          Titular: <span className="font-semibold">{titular.nome}</span>
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
          <Card>
            <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField control={form.control} name="nome" render={({ field }) => (<FormItem className="lg:col-span-2"><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="sexo" render={({ field }) => (<FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Feminino">Feminino</SelectItem><SelectItem value="Masculino">Masculino</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="grauParentesco" render={({ field }) => (<FormItem><FormLabel>Grau de Parentesco</FormLabel><FormControl><Input placeholder="Ex: Cônjuge, Filho(a)..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="estadoCivil" render={({ field }) => (<FormItem><FormLabel>Estado Civil</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Solteiro">1 - Solteiro</SelectItem><SelectItem value="Casado">2 - Casado</SelectItem><SelectItem value="Divorciado">3 - Divorciado</SelectItem><SelectItem value="Viúvo">4 - Viúvo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="dataNascimento" render={({ field }) => (<FormItem><FormLabel>Data de Nascimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="rg" render={({ field }) => (<FormItem><FormLabel>RG</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="orgaoEmissor" render={({ field }) => (<FormItem><FormLabel>Org. Emissor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="nacionalidade" render={({ field }) => (<FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="nomeMae" render={({ field }) => (<FormItem className="lg:col-span-2"><FormLabel>Nome da Mãe</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="profissao" render={({ field }) => (<FormItem><FormLabel>Profissão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="telefone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="cns" render={({ field }) => (<FormItem><FormLabel>Número CNS</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="motivoDependencia" render={({ field }) => (<FormItem><FormLabel>Motivo de Dependência</FormLabel><FormControl><Input placeholder="Ex: Casamento, Filho..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="inicioDependencia" render={({ field }) => (<FormItem><FormLabel>Início da Dependência</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Plano de Saúde</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
              <FormField
                control={form.control}
                name="plano.adesao"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 pt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Adesão</FormLabel>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="plano.inicioVigencia" render={({ field }) => (<FormItem><FormLabel>Início da Vigência</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="plano.cobertura" render={({ field }) => (<FormItem><FormLabel>Cobertura</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="1">1 - Enfermaria</SelectItem><SelectItem value="2">2 - Apartamento</SelectItem><SelectItem value="3">3 - VIP</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.formState.isSubmitting ? "Salvando..." : "Salvar Dependente"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      </DialogContent>
    </Dialog>
  );
}