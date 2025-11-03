import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, Company } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from "@/components/ui/table";
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
    return user.companies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.cnpj?.replace(/[^\d]/g, "").includes(searchTerm.replace(/[^\d]/g, ""))
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
              <TableRow>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Razão Social</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id} onClick={() => onSelectEmpresa(company)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>{company.cnpj || 'Não informado'}</TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
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
    return mockBeneficiariosCopart.filter(
      (b) =>
        b.funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.contrato.includes(searchTerm)
    );
  }, [searchTerm]);

  const totalCoparticipacao = useMemo(() => {
    return filteredBeneficiarios.reduce((acc, b) => acc + b.valor, 0);
  }, [filteredBeneficiarios]);

  const handleExportCSV = () => {
    const headers = [
      "Contrato",
      "Funcionário",
      "Vigência",
      "Cancelado",
      "Valor CPA a Faturar"
    ];

    const rows = filteredBeneficiarios.map(b => [
      b.contrato,
      `"${b.funcionario}"`, // Envolve em aspas para lidar com vírgulas no nome
      new Date(b.vigencia).toLocaleDateString('pt-BR'),
      b.cancelado ? 'Sim' : 'Não',
      b.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', '') // Formato numérico brasileiro
    ].join(';'));

    const csvContent = [
      headers.join(';'),
      ...rows
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF para BOM UTF-8 (ajuda o Excel)
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = `coparticipacao_${empresa.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
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
                <TableHead>Contrato</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Cancelado</TableHead>
                <TableHead className="text-right">Valor CPA a Faturar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeneficiarios.length > 0 ? (
                filteredBeneficiarios.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.contrato}</TableCell>
                    <TableCell className="font-medium">{b.funcionario}</TableCell>
                    <TableCell>{new Date(b.vigencia).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{b.cancelado ? 'Sim' : 'Não'}</TableCell>
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
                <TableCell colSpan={4}>Total de beneficiários com coparticipação a faturar: {filteredBeneficiarios.filter(b => b.valor > 0).length}</TableCell>
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
  const [tela, setTela] = useState<'lista' | 'detalhes'>('lista');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Company | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário não for do perfil "cadastro" e tiver apenas uma empresa,
    // seleciona-a e vai direto para a tela de detalhes.
    if (user?.profile !== 'cadastro' && user?.companies.length === 1) {
      const unicaEmpresa = user.companies[0];
      if (unicaEmpresa) {
        selectCompany(unicaEmpresa);
        setEmpresaSelecionada(unicaEmpresa);
        setTela('detalhes');
      }
    }
  }, [user, selectCompany]);

  const handleSelectEmpresa = (empresa: Company) => {
    // Atualiza a empresa selecionada globalmente também
    selectCompany(empresa);
    setEmpresaSelecionada(empresa);
    setTela('detalhes');
  };

  const handleVoltarParaLista = () => {
    setEmpresaSelecionada(null);
    setTela('lista');
    // Se o usuário não for do perfil "cadastro", volta para o dashboard
    // pois a lista completa não é o comportamento padrão para ele.
    if (user?.profile !== 'cadastro') {
      navigate(-1);
    }
  };

  const handleVoltarParaDashboard = () => {
    navigate(-1); // Volta para a tela anterior no histórico de navegação
  };

  if (tela === 'detalhes' && empresaSelecionada) {
    return <TelaDetalhesCoparticipacao empresa={empresaSelecionada} onVoltar={handleVoltarParaLista} />;
  }

  return <TelaSelecaoEmpresa onSelectEmpresa={handleSelectEmpresa} onVoltar={handleVoltarParaDashboard} />;
}