import { useState, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, FileSpreadsheet, FileDigit, Receipt, Download, EllipsisVertical, ArrowUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- DADOS MOCKADOS ---
// Em um ambiente real, estes dados viriam da API.
const mockNotasFiscais = [
  {
    nrNf: "12401",
    competencia: "12/2023",
    vencimento: "2024-01-10",
    valor: 15800.00,
    pago: "NÃO",
    qtdeVidas: 52,
  },
  {
    nrNf: "12345",
    competencia: "11/2023",
    vencimento: "2023-12-10",
    valor: 15250.75,
    pago: "SIM",
    qtdeVidas: 50,
  },
  {
    nrNf: "12301",
    competencia: "10/2023",
    vencimento: "2023-11-10",
    valor: 14980.50,
    pago: "SIM",
    qtdeVidas: 49,
  },
  {
    nrNf: "12258",
    competencia: "09/2023",
    vencimento: "2023-10-10",
    valor: 14800.00,
    pago: "SIM",
    qtdeVidas: 48,
  },
];

type NotaFiscal = typeof mockNotasFiscais[0];

type SortableColumns = keyof NotaFiscal;

export default function DocsFinaceiros() {
  const { user, selectedCompany, selectCompany } = useAuthStore();
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<SortableColumns>('vencimento');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleActionClick = (documento: string, nf: NotaFiscal) => {
    alert(`Simulando download/visualização de: ${documento} para a NF ${nf.nrNf}`);
    // Aqui você implementaria a lógica real de download/visualização
  };

  const handleCompanyChange = (companyId: string) => {
    if (!companyId) {
      // Limpa a seleção se "Todas as empresas" for escolhido
      selectCompany(null);
      return;
    }
    const company = user?.companies.find(c => c.id === companyId);
    if (company) {
      selectCompany(company);
    }
  };

  const handleSort = (column: SortableColumns) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedNotasFiscais = useMemo(() => {
    const sorted = [...mockNotasFiscais].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (sortColumn === 'vencimento') {
        return new Date(valA).getTime() - new Date(valB).getTime();
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB);
      }
      return (valA as number) - (valB as number);
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [sortColumn, sortDirection]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {selectedCompany ? (
              <>
                <CardTitle className="text-2xl font-bold">{selectedCompany.id} – {selectedCompany.razaoSocial || selectedCompany.name}</CardTitle>
                <CardDescription>Relação das Notas, Boletos e Relatórios</CardDescription>
              </>
            ) : (
              <CardTitle>Documentos Financeiros</CardTitle>
            )}
          </div>
          {user && user.companies.length > 0 && (
            <div className="w-full sm:w-80">
              <Select onValueChange={handleCompanyChange} value={selectedCompany?.id || ''}>
                <SelectTrigger><SelectValue placeholder="Selecione uma empresa para ver os detalhes..." /></SelectTrigger>
                <SelectContent>
                  {user?.profile === 'Admin' && <SelectItem value="">Ver todas as empresas</SelectItem>}
                  {user.companies.map(company => (<SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedCompany ? (
          <div className="border rounded-md">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('competencia')} className="px-0 hover:bg-transparent">
                      Competência <ArrowUpDown className={`ml-2 h-4 w-4 ${sortColumn === 'competencia' ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[180px] text-right">
                    <Button variant="ghost" onClick={() => handleSort('valor')} className="px-0 hover:bg-transparent">
                      Valor <ArrowUpDown className={`ml-2 h-4 w-4 ${sortColumn === 'valor' ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <Button variant="ghost" onClick={() => handleSort('vencimento')} className="px-0 hover:bg-transparent">
                      Vencimento <ArrowUpDown className={`ml-2 h-4 w-4 ${sortColumn === 'vencimento' ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[140px] text-center">
                    <Button variant="ghost" onClick={() => handleSort('qtdeVidas')} className="px-0 hover:bg-transparent">
                      Qtde. Vidas <ArrowUpDown className={`ml-2 h-4 w-4 ${sortColumn === 'qtdeVidas' ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <Button variant="ghost" onClick={() => handleSort('nrNf')} className="px-0 hover:bg-transparent">
                      Nr. NF <ArrowUpDown className={`ml-2 h-4 w-4 ${sortColumn === 'nrNf' ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <Button variant="ghost" onClick={() => handleSort('pago')} className="px-0 hover:bg-transparent">
                      Status <ArrowUpDown className={`ml-2 h-4 w-4 ${sortColumn === 'pago' ? 'text-foreground' : 'text-muted-foreground/50'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedNotasFiscais.map((nota) => (
                  <TableRow key={nota.nrNf} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground">{nota.competencia}</TableCell>
                    <TableCell className="text-right font-mono">{nota.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    <TableCell>{new Date(nota.vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                    <TableCell className="text-center">{nota.qtdeVidas}</TableCell>
                    <TableCell className="font-medium">{nota.nrNf}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nota.pago === 'SIM' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>{nota.pago === 'SIM' ? 'Pago' : 'Pendente'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações para NF {nota.nrNf}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleActionClick("Nota Fiscal", nota)}><FileText className="mr-2 h-4 w-4 text-blue-500" /> Nota Fiscal</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleActionClick("Boleto", nota)} disabled={nota.pago === 'SIM'}><Receipt className="mr-2 h-4 w-4 text-orange-500" /> Boleto</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" /> Relatórios
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleActionClick("Relatório NF", nota)}><FileSpreadsheet className="mr-2 h-4 w-4 text-blue-500" /> Relatório (Nota Fiscal)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleActionClick("Relatório Repasse", nota)}><FileDigit className="mr-2 h-4 w-4" /> Relatório (Repasse)</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuItem onClick={() => handleActionClick("Arquivo de Importação", nota)}><Download className="mr-2 h-4 w-4 text-gray-600" /> Arquivo de Importação</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption className="text-sm text-muted-foreground mt-4">Lista de documentos financeiros dos últimos meses.</TableCaption>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Por favor, selecione uma empresa para ver os documentos.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </CardFooter>
    </Card>
  );
}