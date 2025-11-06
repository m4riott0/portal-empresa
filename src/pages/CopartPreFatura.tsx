import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, Company } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter, TableCaption } from "@/components/ui/table";
import { ArrowLeft, Download, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- DADOS MOCKADOS PARA TELA 2 ---
const mockBeneficiariosCopart = [
  { id: 1, contrato: '789012', funcionario: 'João da Silva', vigencia: '2022-01-15', cancelado: false, valor: 125.50 },
  { id: 2, contrato: '789013', funcionario: 'Maria Oliveira', vigencia: '2021-11-20', cancelado: false, valor: 75.00 },
  { id: 3, contrato: '789014', funcionario: 'Carlos Pereira', vigencia: '2023-03-10', cancelado: true, valor: 0.00 },
  { id: 4, contrato: '789015', funcionario: 'Ana Costa', vigencia: '2020-08-01', cancelado: false, valor: 210.75 },
  { id: 5, contrato: '789016', funcionario: 'Pedro Martins', vigencia: '2022-05-25', cancelado: false, valor: 55.20 },
];

type BeneficiarioCopart = typeof mockBeneficiariosCopart[0];

/**
 * Tela 1: Seleção de Empresa
 */
function TelaSelecaoEmpresa({ onSelectEmpresa, onVoltar }: { onSelectEmpresa: (empresa: Company) => void; onVoltar: () => void }) {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
 
  const filteredCompanies = useMemo(() => {
    if (!user?.companies) return [];
    const term = searchTerm.toLowerCase();
    return user.companies.filter(
      (company) =>
        company.name.toLowerCase().includes(term) ||
        company.cnpj?.replace(/\D/g, "").includes(term.replace(/\D/g, ""))
    );
  }, [user?.companies, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coparticipação Pré-faturada</CardTitle>
        <CardDescription>Selecione a empresa para verificar a Coparticipação pré-faturada</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar Razão Social ou CNPJ"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[70%]">Empresa</TableHead>
                <TableHead className="text-right">CNPJ/CPF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id} onClick={() => onSelectEmpresa(company)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {company.cnpj || 'Não informado'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    Nenhuma empresa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Tela 2: Detalhes da Coparticipação
 */
function TelaDetalhesCoparticipacao({ empresa, onVoltar }: { empresa: Company; onVoltar: () => void; }) {
  const [searchTerm, setSearchTerm] = useState("");
  const dataCalculo = useMemo(() => new Date(), []);

  const filteredBeneficiarios = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return mockBeneficiariosCopart.filter(
      (b) =>
        b.funcionario.toLowerCase().includes(term) ||
        b.contrato.includes(term)
    );
  }, [searchTerm]);

  const totalCoparticipacao = useMemo(() =>
    filteredBeneficiarios.reduce((acc, b) => acc + b.valor, 0),
    [filteredBeneficiarios]
  );

  const handleExportCSV = () => {
    const headers = ["Contrato", "Funcionário", "Vigência", "Cancelado", "Valor CPA a Faturar"];
    const rows = filteredBeneficiarios.map(b => [
      b.contrato,
      `"${b.funcionario}"`,
      new Date(b.vigencia).toLocaleDateString('pt-BR'),
      b.cancelado ? 'Sim' : 'Não',
      b.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', '')
    ].join(';'));
    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `coparticipacao_${empresa.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold text-primary">{empresa.name}</p>
        <CardTitle>Detalhes da Coparticipação</CardTitle>
        <CardDescription>
          Valor de Coparticipação a ser faturado calculado em {dataCalculo.toLocaleDateString('pt-BR')} às {dataCalculo.toLocaleTimeString('pt-BR')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default">
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            O valor pode sofrer alterações caso ocorram novos procedimentos após a data e hora exibidas.
          </AlertDescription>
        </Alert>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar Nome ou Contrato"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Funcionário</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Valor CPA a Faturar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeneficiarios.length > 0 ? (
                filteredBeneficiarios.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{b.funcionario}</div>
                      <div className="text-xs text-muted-foreground">Contrato: {b.contrato}</div>
                    </TableCell>
                    <TableCell>{new Date(b.vigencia).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        b.cancelado 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>{b.cancelado ? 'Cancelado' : 'Ativo'}</span>
                    </TableCell>
                    <TableCell className="text-right">{b.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum beneficiário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <UiTableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total de beneficiários com coparticipação a faturar: {filteredBeneficiarios.filter(b => b.valor > 0).length}</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  Total Geral: {totalCoparticipacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
              </TableRow>
            </UiTableFooter>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Componente Principal que gerencia o estado entre as telas
 */
export default function CopartPreFatura() {
  const { user, selectedCompany, selectCompany } = useAuthStore();
  const navigate = useNavigate();

  // Estado inicial baseado no perfil do usuário
  const initialEmpresa = (user?.profile !== 'cadastro' && user?.companies?.length === 1)
    ? user.companies[0]
    : null;
  const [tela, setTela] = useState(initialEmpresa ? 'detalhes' : 'lista');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Company | null>(initialEmpresa);

  const handleSelectEmpresa = (empresa: Company) => {
    selectCompany(empresa);
    setEmpresaSelecionada(empresa);
    setTela('detalhes');
  };

  const handleVoltarParaLista = () => {
    setEmpresaSelecionada(null);
    setTela('lista');
    if (user?.profile !== 'cadastro') navigate(-1);
  };
  const handleVoltarParaDashboard = () => navigate(-1);

  if (tela === 'detalhes' && empresaSelecionada) {
    return <TelaDetalhesCoparticipacao empresa={empresaSelecionada} onVoltar={handleVoltarParaLista} />;
  }
  return <TelaSelecaoEmpresa onSelectEmpresa={handleSelectEmpresa} onVoltar={handleVoltarParaDashboard} />;
}