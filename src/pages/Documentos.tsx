import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud, FileText, X, CheckCircle2, AlertCircle, Loader2, Paperclip,
  ArrowLeft, Search, User, ShieldCheck, ShieldAlert, ShieldX, ThumbsUp, ThumbsDown, Eye, MoreVertical
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

// --- TIPOS E DADOS MOCKADOS (REUTILIZANDO E ADAPTANDO DE BENEFICIARIOS.TSX) ---

type DocumentoStatus = 'Pendente' | 'Aprovado' | 'Recusado';

type DocumentoEnviado = {
  id: number;
  nome: string;
  dataEnvio: string;
  status: DocumentoStatus;
  url?: string; // para visualização
  motivoRecusa?: string;
};

type Beneficiario = {
  id: number;
  nome: string;
  cpf: string;
  statusUsuario: 'Ativo' | 'Cancelado' | 'A Cadastrar';
  documentos: DocumentoEnviado[];
  cnpj: string;
  nomeEmpresa?: string; // Adicionado para facilitar a exibição na lista consolidada
};

const mockBeneficiarios: Beneficiario[] = [
  { id: 1, nome: 'João da Silva', cpf: '123.456.789-01', statusUsuario: 'Ativo', cnpj: '11.222.333/0001-44', documentos: [
    { id: 101, nome: 'documentacao_joao_v1.pdf', dataEnvio: '2023-10-15', status: 'Aprovado', url: '#' },
  ]},
  { id: 2, nome: 'Maria Oliveira', cpf: '987.654.321-09', statusUsuario: 'Ativo', cnpj: '11.222.333/0001-44', documentos: [
    { id: 201, nome: 'docs_maria_v1.pdf', dataEnvio: '2023-11-01', status: 'Recusado', motivoRecusa: 'Assinatura no RG está borrada.', url: '#' },
    { id: 202, nome: 'docs_maria_v2_corrigido.pdf', dataEnvio: '2023-11-05', status: 'Pendente' },
  ]},
  { id: 3, nome: 'Carlos Pereira', cpf: '111.222.333-44', statusUsuario: 'A Cadastrar', cnpj: '11.222.333/0001-44', documentos: [] },
  { id: 4, nome: 'Juliana Alves', cpf: '444.555.666-77', statusUsuario: 'Ativo', cnpj: '44.555.666/0001-77', documentos: [
    { id: 301, nome: 'documentos_completos_juliana.pdf', dataEnvio: '2023-12-01', status: 'Pendente' },
  ]},
];

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

type UploadableFile = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
};

/**
 * Determina o status consolidado dos documentos de um beneficiário.
 * A ordem de prioridade é: Recusado > Pendente > Aprovado.
 * @param docs - Lista de documentos enviados.
 */
const getDocumentStatusSummary = (docs: DocumentoEnviado[]): { status: DocumentoStatus, count: number } => {
  if (docs.some(d => d.status === 'Recusado')) return { status: 'Recusado', count: docs.filter(d => d.status === 'Recusado').length };
  if (docs.some(d => d.status === 'Pendente')) return { status: 'Pendente', count: docs.filter(d => d.status === 'Pendente').length };
  if (docs.length > 0) return { status: 'Aprovado', count: docs.length };
  return { status: 'Pendente', count: 0 }; // Nenhum documento enviado ainda
};

/**
 * Determina o status consolidado dos documentos para todos os beneficiários de uma empresa.
 * A ordem de prioridade é: Recusado > Pendente > Aprovado.
 * @param companyCnpj - CNPJ da empresa.
 */
const getCompanyDocStatus = (companyCnpj: string): DocumentoStatus => {
  const companyBeneficiarios = mockBeneficiarios.filter(b => b.cnpj === companyCnpj);
  if (companyBeneficiarios.some(b => b.documentos.some(d => d.status === 'Recusado'))) return 'Recusado';
  if (companyBeneficiarios.some(b => b.documentos.some(d => d.status === 'Pendente'))) return 'Pendente';
  if (companyBeneficiarios.every(b => b.documentos.length > 0 && b.documentos.every(d => d.status === 'Aprovado'))) return 'Aprovado';
  return 'Pendente'; // Se houver beneficiários sem documentos ou com status misto sem recusa/pendência explícita
};

/**
 * Hook customizado para gerenciar a lógica de busca e filtragem de beneficiários.
 */
function useBeneficiariosData() {
  const { user, selectedCompany, selectCompany } = useAuthStore();
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [selectedBeneficiario, setSelectedBeneficiario] = useState<Beneficiario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentoStatus | 'Todos'>('Todos');

  useEffect(() => {
    // Auto-seleciona a empresa se o usuário não for 'cadastro' e tiver apenas uma.
    if (user?.profile !== 'cadastro' && user?.companies.length === 1) {
      selectCompany(user.companies[0]);
    }
  }, [user, selectCompany]);

  useEffect(() => {
    // Lógica para carregar os beneficiários com base na empresa selecionada ou no perfil.
    if (selectedCompany) {
      const data = mockBeneficiarios.filter(b => b.cnpj === selectedCompany.cnpj);
      setBeneficiarios(data);
    } else if (user?.profile === 'cadastro') {
      // Perfil 'cadastro' sem empresa selecionada: mostra todos.
      const companyNameMap = new Map(mockAllCompanies.map(c => [c.cnpj, c.name]));
      const allData = mockBeneficiarios.map(b => ({ ...b, nomeEmpresa: companyNameMap.get(b.cnpj) || 'N/A' }));
      setBeneficiarios(allData);
    } else {
      // Outros perfis sem empresa selecionada: lista vazia.
      setBeneficiarios([]);
    }
    setSelectedBeneficiario(null);
  }, [selectedCompany, user]);

  const filteredBeneficiarios = useMemo(() => {
    return beneficiarios.filter(b => {
      const searchMatch = b.nome.toLowerCase().includes(searchTerm.toLowerCase()) || b.cpf.replace(/[^\d]/g, "").includes(searchTerm.replace(/[^\d]/g, ""));
      if (statusFilter === 'Todos') return searchMatch;
      const statusSummary = getDocumentStatusSummary(b.documentos);
      return searchMatch && statusSummary.status === statusFilter;
    });
  }, [beneficiarios, searchTerm, statusFilter]);
  
  return {
    user,
    selectedCompany,
    selectCompany,
    beneficiarios,
    setBeneficiarios,
    selectedBeneficiario,
    setSelectedBeneficiario,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredBeneficiarios,
  };
}

// --- COMPONENTE PRINCIPAL ---
export default function Documentos() {
  const {
    user, selectedCompany, selectCompany,
    beneficiarios, setBeneficiarios,
    selectedBeneficiario, setSelectedBeneficiario,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    filteredBeneficiarios,
  } = useBeneficiariosData();
  const navigate = useNavigate();

  // Para usuários que não são 'cadastro' e têm mais de uma empresa,
  // a tela de seleção é a primeira coisa a ser mostrada.
  if (user?.profile !== 'cadastro' && user && user.companies.length > 1 && !selectedCompany) {
    return <TelaSelecaoEmpresa onSelectEmpresa={selectCompany} />;
  }

  if (selectedBeneficiario) {
    return <TelaGerenciamento 
              beneficiario={selectedBeneficiario} 
              onVoltar={() => setSelectedBeneficiario(null)} 
              setBeneficiarios={setBeneficiarios}
            />;
  }

  const isShowingAll = user?.profile === 'cadastro' && !selectedCompany;

  return (
    <div className="space-y-6">
      {/* Para o perfil de cadastro, a seleção de empresa é um filtro opcional */}
      {user?.profile === 'cadastro' && (
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Filtro de Empresa</CardTitle>
            <CardDescription>Selecione uma empresa para filtrar a lista de beneficiários ou veja todos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(cnpj) => selectCompany(mockAllCompanies.find(c => c.cnpj === cnpj) || null)} value={selectedCompany?.cnpj || ''}>
              <SelectTrigger className="w-full sm:w-1/2"><SelectValue placeholder="Visualizando todas as empresas..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value=''>Ver todas as empresas</SelectItem>
                {mockAllCompanies.map(c => <SelectItem key={c.id} value={c.cnpj}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Gerenciamento de Documentos</CardTitle>
            <CardDescription>
              {isShowingAll ? "Visão consolidada de todos os beneficiários." : `Beneficiários da empresa: ${selectedCompany?.name}`}
            </CardDescription>
          </div>
        </div>
        <CardDescription>
          Selecione um beneficiário para enviar, visualizar ou gerenciar seus documentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou CPF do beneficiário..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Filtrar por status:</span>
            <Button size="sm" variant={statusFilter === 'Todos' ? 'secondary' : 'outline'} onClick={() => setStatusFilter('Todos')}>Todos</Button>
            <Button size="sm" variant={statusFilter === 'Pendente' ? 'secondary' : 'outline'} onClick={() => setStatusFilter('Pendente')} className="flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" /> Pendentes
            </Button>
            <Button size="sm" variant={statusFilter === 'Recusado' ? 'destructive' : 'outline'} onClick={() => setStatusFilter('Recusado')} className="flex items-center gap-1.5">
              <ShieldX className="h-4 w-4" /> Recusados
            </Button>
            <Button size="sm" variant={statusFilter === 'Aprovado' ? 'default' : 'outline'} onClick={() => setStatusFilter('Aprovado')} className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Aprovados
            </Button>
          </div>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableCaption>
              {beneficiarios.length === 0 ? "Nenhum beneficiário encontrado para esta empresa." : `Exibindo ${filteredBeneficiarios.length} beneficiário(s).`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiário</TableHead>
                {isShowingAll && (
                  <TableHead>Empresa</TableHead>
                )}
                <TableHead>CPF</TableHead>
                <TableHead className="text-center">Status dos Documentos</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeneficiarios.length > 0 ? (
                filteredBeneficiarios.map(b => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedBeneficiario(b)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" /> {b.nome}
                      </div>
                    </TableCell>
                    {isShowingAll && (
                      <TableCell>{b.nomeEmpresa}</TableCell>
                    )}
                    <TableCell>{b.cpf}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge statusInfo={getDocumentStatusSummary(b.documentos)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Gerenciar</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isShowingAll ? 5 : 4} className="h-24 text-center">
                    Nenhum beneficiário corresponde à sua busca.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </CardFooter>
    </Card>
    </div>
  );
}

// --- TELA DE SELEÇÃO DE EMPRESA (TELA 1) ---

// Mock de todas as empresas para o perfil de cadastro
const mockAllCompanies = [
  { id: '1', name: 'Empresa A', cnpj: '11.222.333/0001-44' },
  { id: '2', name: 'Empresa B', cnpj: '44.555.666/0001-77' },
  { id: '3', name: 'Empresa C', cnpj: '77.888.999/0001-00' },
];

function TelaSelecaoEmpresa({ onSelectEmpresa }: { onSelectEmpresa: (empresa: any) => void; }) {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [allCompanies, setAllCompanies] = useState<(any & { docStatus: DocumentoStatus })[]>([]);

  // Simula a busca de todas as empresas para o perfil de cadastro
  useEffect(() => {
    if (user?.profile === 'cadastro') {
      // TODO: Substituir por chamada de API real que busca TODAS as empresas
      const companiesWithStatus = mockAllCompanies.map(company => ({
        ...company,
        docStatus: getCompanyDocStatus(company.cnpj)
      }));
      setAllCompanies(companiesWithStatus);
    } else if (user?.companies) {
      const userCompaniesWithStatus = user.companies.map(company => ({
        ...company,
        docStatus: getCompanyDocStatus(company.cnpj)
      }));
      setAllCompanies(userCompaniesWithStatus);
    }
  }, [user]);

  const companiesToShow = user?.profile === 'cadastro' ? allCompanies : allCompanies.filter(c => user?.companies.some(uc => uc.id === c.id));

  const filteredCompanies = useMemo(() => {
    return companiesToShow.filter(
      (company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.cnpj || "").replace(/[^\d]/g, "").includes(searchTerm.replace(/[^\d]/g, ""))
    );
  }, [companiesToShow, searchTerm]);

  return (
    <Card className="w-full max-w-5xl mx-auto mb-6">
      <CardHeader>
        <CardTitle>Seleção de Empresa</CardTitle>
        <CardDescription>Selecione a empresa para visualizar os beneficiários.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Pesquisar por Razão Social ou CNPJ" className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CNPJ</TableHead>
                <TableHead>Razão Social</TableHead>
                <TableHead className="text-center">Status Documentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id} onClick={() => onSelectEmpresa(company)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{company.cnpj || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-center"><StatusBadge statusInfo={{ status: company.docStatus, count: 0 }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- TELA DE GERENCIAMENTO (TELA 2) ---

type TelaGerenciamentoProps = { beneficiario: Beneficiario; onVoltar: () => void; setBeneficiarios: React.Dispatch<React.SetStateAction<Beneficiario[]>> };

function TelaGerenciamento({ beneficiario, onVoltar, setBeneficiarios }: TelaGerenciamentoProps) {
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoEnviado[]>(beneficiario.documentos);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).map(file => ({
        id: `${file.name}-${file.lastModified}`,
        file, status: 'pending', progress: 0,
      } as UploadableFile));

      setFiles(prevFiles => {
        const existingIds = new Set(prevFiles.map(f => f.id));
        const uniqueNewFiles = newFiles.filter(f => !existingIds.has(f.id));
        return [...prevFiles, ...uniqueNewFiles];
      });
    }
  };

  const handleRemoveFile = (id: string) => setFiles(files.filter(f => f.id !== id));

  const simulateUpload = (fileId: string) => {
    const uploadInterval = setInterval(() => {
      setFiles(prevFiles =>
        prevFiles.map(f => {
          if (f.id === fileId && f.status === 'uploading') {
            const newProgress = f.progress + 20;
            if (newProgress >= 100) {
              clearInterval(uploadInterval);
              // TODO: Após sucesso na API, adicionar à lista de documentos
              const newDoc: DocumentoEnviado = {
                id: Date.now(),
                nome: f.file.name, 
                dataEnvio: new Date().toISOString().split('T')[0],
                status: 'Pendente',
              };
              setDocumentos(prevDocs => [newDoc, ...prevDocs]);
              return { ...f, progress: 100, status: 'success' };
            }
            return { ...f, progress: newProgress };
          }
          return f;
        })
      );
    }, 300);
  };

  const handleUploadClick = () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast({ title: "Nenhum arquivo novo para enviar.", description: "Arraste ou selecione arquivos para a área de upload." });
      return;
    }

    setFiles(prevFiles =>
      prevFiles.map(f => (f.status === 'pending' ? { ...f, status: 'uploading' } : f))
    );
    pendingFiles.forEach(fileToUpload => simulateUpload(fileToUpload.id));
    setTimeout(() => setFiles([]), 3000); // Limpa a lista de upload após um tempo
  };

  const isUploading = files.some(f => f.status === 'uploading');

  const handleDocAction = (docId: number, newStatus: DocumentoStatus, motivo?: string) => {
    // TODO: Chamar API para atualizar o status
    const updatedDocs = documentos.map(d => 
      d.id === docId ? { ...d, status: newStatus, motivoRecusa: motivo } : d
    );
    setDocumentos(updatedDocs);

    // Atualiza a lista principal de beneficiários para refletir a mudança de status
    setBeneficiarios(prev => prev.map(b => 
      b.id === beneficiario.id ? { ...b, documentos: updatedDocs } : b
    ));

    toast({ 
      title: `Documento ${newStatus.toLowerCase()}!`, 
      className: newStatus === 'Recusado' ? 'bg-red-100 dark:bg-red-900' : undefined });
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onVoltar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-2xl">Documentos de: {beneficiario.nome}</CardTitle>
            <CardDescription>CPF: {beneficiario.cpf}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de Upload */}
        <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center hover:border-primary transition-colors">
          <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Arraste e solte o arquivo aqui, ou{" "}
            <label htmlFor="file-upload" className="font-semibold text-primary cursor-pointer hover:underline">clique para selecionar</label>.
          </p>
          <p className="text-xs text-muted-foreground mt-1">Apenas arquivos PDF são aceitos.</p>
          <input id="file-upload" type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileSelect(e.target.files)} disabled={isUploading} />
        </div>

        {/* Lista de Arquivos para Upload */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Arquivos para Envio ({files.length})</h3>
            {files.map(uploadableFile => (
              <div key={uploadableFile.id} className="flex items-center justify-between gap-4 p-3 rounded-md border bg-muted/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-medium truncate" title={uploadableFile.file.name}>{uploadableFile.file.name}</p>
                    {uploadableFile.status === 'uploading' && <Progress value={uploadableFile.progress} className="h-1.5 mt-1" />}
                    {uploadableFile.status === 'success' && <p className="text-xs text-green-600">Enviado com sucesso!</p>}
                    {uploadableFile.status === 'error' && <p className="text-xs text-red-600" title={uploadableFile.error}>Erro no envio.</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleRemoveFile(uploadableFile.id)} disabled={isUploading}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button onClick={handleUploadClick} disabled={isUploading || !files.some(f => f.status === 'pending')}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
              {isUploading ? "Enviando..." : `Enviar ${files.filter(f => f.status === 'pending').length} Arquivo(s)`}
            </Button>
          </div>
        )}

        {/* Lista de Documentos Enviados */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Documentos Enviados</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.length > 0 ? (
                  documentos.map(d => <DocumentRow key={d.id} doc={d} onAction={handleDocAction} />)
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum documento enviado para este beneficiário.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onVoltar}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a lista</Button>
      </CardFooter>
    </Card>
  );
}

// --- SUB-COMPONENTES ---

function StatusBadge({ statusInfo }: { statusInfo: { status: DocumentoStatus, count: number } }) {
  const { status, count } = statusInfo;
  const variants: Record<DocumentoStatus, "default" | "destructive" | "secondary"> = {
    Aprovado: "default",
    Recusado: "destructive",
    Pendente: "secondary",
  };
  const icons: Record<DocumentoStatus, React.ReactNode> = {
    Aprovado: <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />,
    Recusado: <ShieldX className="h-3.5 w-3.5 mr-1.5" />,
    Pendente: <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />,
  };
  const textMap: Record<DocumentoStatus, string> = {
    Aprovado: "Aprovado",
    Recusado: count > 1 ? `${count} Recusado(s)` : "Recusado",
    Pendente: count > 0 ? (count > 1 ? `${count} Pendente(s)` : "Pendente") : (status === 'Pendente' ? 'Pendente' : 'Nenhum documento'),
  };

  return (
    <Badge variant={variants[status]} className={`flex items-center justify-center w-fit mx-auto text-xs`}>
      {icons[status]}
      {textMap[status]}
    </Badge>
  );
}

function DocumentRow({ doc, onAction }: { doc: DocumentoEnviado; onAction: (docId: number, status: DocumentoStatus, motivo?: string) => void; }) {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{doc.nome}</TableCell>
      <TableCell>{new Date(doc.dataEnvio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
      <TableCell className="text-center"><StatusBadge statusInfo={{ status: doc.status, count: 1 }} /></TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem disabled={!doc.url} onClick={() => window.open(doc.url, '_blank')}>
              <Eye className="mr-2 h-4 w-4" /> Visualizar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-blue-600 focus:text-blue-700 dark:text-blue-400 dark:focus:text-blue-500" onClick={() => onAction(doc.id, 'Aprovado')}>
              <ThumbsUp className="mr-2 h-4 w-4" /> Aprovar
            </DropdownMenuItem>
            <DialogRecusarDocumento doc={doc} onConfirm={(motivo) => onAction(doc.id, 'Recusado', motivo)}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-500">
                <ThumbsDown className="mr-2 h-4 w-4" /> Recusar
              </DropdownMenuItem>
            </DialogRecusarDocumento>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function DialogRecusarDocumento({ doc, onConfirm, children }: { doc: DocumentoEnviado, onConfirm: (motivo: string) => void, children: React.ReactNode }) {  
  const [motivo, setMotivo] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm(motivo);
    setIsOpen(false);
    setMotivo('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recusar Documento</DialogTitle>
          <DialogDescription>
            Descreva o motivo da recusa para o documento <span className="font-semibold">{doc.nome}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="motivo" className="text-right">Motivo</Label>
            <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="col-span-3" placeholder="Ex: Documento ilegível, informação incorreta..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={!motivo.trim()}>Confirmar Recusa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
