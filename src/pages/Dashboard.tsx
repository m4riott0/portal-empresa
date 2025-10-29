import { Link } from "react-router-dom";
import { Company, useAuthStore } from "@/store/useAuthStore";
import { Building, Mail, Globe, FileText, WalletCards, Briefcase, LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuickAccessLinkProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const QuickAccessLink = ({ to, icon: Icon, title, description }: QuickAccessLinkProps) => (
  <Link to={to} className="block p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
    <div className="flex items-center gap-3 mb-1"><Icon className="h-5 w-5 text-primary" /><h3 className="font-semibold text-primary">{title}</h3></div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </Link>
);

export default function Dashboard() {
  const { user, selectedCompany, selectCompany } = useAuthStore();

  const handleCompanyChange = (companyId: string) => {
    const company = user?.companies.find(c => c.id === companyId);
    if (company) {
      selectCompany(company);
    }
  };

  return (
    <div className="space-y-8">
      {user && user.companies.length > 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-primary" />
              <CardTitle>Seleção de Empresa</CardTitle>
            </div>
            <CardDescription>Escolha a empresa para visualizar os dados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleCompanyChange} value={selectedCompany?.id}>
              <SelectTrigger className="w-full md:w-1/2 lg:w-1/3"><SelectValue placeholder="Selecione uma empresa..." /></SelectTrigger>
              <SelectContent>{user.companies.map(company => (<SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>))}</SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedCompany ? (
        <>
          {/* Company Data */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-primary" />
                <CardTitle>Dados da Empresa</CardTitle>
              </div>
              <CardDescription>Informações cadastrais da empresa selecionada.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 text-sm -mt-2">
                <div className="space-y-1"><dt className="font-medium text-muted-foreground">Razão Social</dt><dd className="font-semibold text-foreground">{selectedCompany.razaoSocial || 'Não informado'}</dd></div>
                <div className="space-y-1"><dt className="font-medium text-muted-foreground">Logradouro</dt><dd className="text-foreground">{selectedCompany.logradouro || 'Não informado'}</dd></div>
                <div className="space-y-1"><dt className="font-medium text-muted-foreground">Complemento</dt><dd className="text-foreground">{selectedCompany.complemento || 'Não informado'}</dd></div>
                <div className="space-y-1"><dt className="font-medium text-muted-foreground">Bairro</dt><dd className="text-foreground">{selectedCompany.bairro || 'Não informado'}</dd></div>
                <div className="space-y-1"><dt className="font-medium text-muted-foreground">Cidade</dt><dd className="text-foreground">{selectedCompany.cidade || 'Não informado'}</dd></div>
                {selectedCompany.email && (
                  <div className="space-y-1"><dt className="font-medium text-muted-foreground">E-mail</dt><dd><a href={`mailto:${selectedCompany.email}`} className="flex items-center gap-2 text-primary hover:underline"><Mail className="h-4 w-4" />{selectedCompany.email}</a></dd></div>
                )}
                {selectedCompany.site && (
                  <div className="space-y-1"><dt className="font-medium text-muted-foreground">Site</dt><dd><a href={`https://${selectedCompany.site}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="h-4 w-4" />{selectedCompany.site}</a></dd></div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Available Links */}
          <Card>
            <CardHeader><CardTitle>Acessos Rápidos</CardTitle><CardDescription>Consulte informações e documentos importantes.</CardDescription></CardHeader>
            <CardContent>
              <ul className="grid gap-4 sm:grid-cols-2">
                <li><QuickAccessLink to="/copart-pre-fatura" icon={FileText} title="Coparticipação Pré-faturada" description="Consulte os detalhes de coparticipação antes do faturamento." /></li>
                <li><QuickAccessLink to="/docs-financeiros" icon={WalletCards} title="Documentos Financeiros" description="Acesse notas, boletos e relatórios de beneficiários." /></li>
              </ul>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground w-full text-center">Visualizando dados para a empresa: <span className="font-semibold text-foreground">{selectedCompany.name}</span></p>
            </CardFooter>
          </Card>
        </>
      ) : (
        user && user.companies.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Por favor, selecione uma empresa acima para visualizar seus dados e acessos rápidos.</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
