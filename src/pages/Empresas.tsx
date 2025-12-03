import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePlus, Pencil } from "lucide-react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";





type Empresa = {
    id: number;
    nome?: string;
    cnpj?: string;
}

// const form = useForm<EmpresaFormData>({
//     resolver: zodResolver(EmpresaSchema),
// })

export default function Empresas() {

    const empresas = [
        { id: 1, nome: "Empresa A", cnpj: "12.345.678/0001-90" },
        { id: 2, nome: "Empresa B", cnpj: "98.765.432/0001-12" },
    ];

    const empresa = {
        nome: "Empresa X",
    }

    const handleEdit = (data: EmpresaFormData) => {
        console.log("Dados para EDIÇÃO:", data); // data incluirá o ID
        // Chamada API: fetch('/api/empresas/' + data.id, { method: 'PUT', body: JSON.stringify(data) });
    };

    return (
        <div className="space-y-8">

            {/* CARD DA TABELA */}
            <Card className="w-full max-w-6xl mx-auto">

                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CardTitle>Empresas</CardTitle>
                    </div>
                    <CardDescription>
                        Cadastrar/Editar empresas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-5">
                    <Button className="btn-medical">
                        <CirclePlus className="mr-2 h-4 w-4" /> Nova Empresa
                    </Button>
                    {
                        (!empresas.length) ?
                            (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhuma empresa encontrada.
                                </p>
                            ) :
                            (
                                <>
                                    <div className="relative flex-1 max-w-sm">
                                        <search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Pesquisar por nome..."
                                            // onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>


                                    <div className="border rounded-md my-5 ">
                                        <Table className="w-full">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Empresa
                                                    </TableHead>

                                                    <TableHead className="text-center">
                                                        Ações
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {empresas.map((empresa) => (
                                                    <TableRow key={empresa.id} className="hover:bg-muted/50">

                                                        <TableCell className="text-muted-foreground items-center">
                                                            {empresa.nome} - {empresa.cnpj}


                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-center">
                                                            <HoverCard openDelay={0} closeDelay={0}>
                                                                <HoverCardTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                    // onClick={() => {
                                                                    //     setPermission(empresa)
                                                                    //     setOpenModal("alterPermission")
                                                                    // }}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </HoverCardTrigger>

                                                                <HoverCardContent className="w-60 text-sm">
                                                                    Editar Empresa.
                                                                </HoverCardContent>
                                                            </HoverCard>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                </>
                            )
                    }
                </CardContent>
            </Card>


            {/* DIALOG DE CADASTRAO/EDICAO */}

            <Dialog
                open
            //  onOpenChange={onOpenChange}
            >
                <DialogContent
                    className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {/* {beneficiario.id ? "Editar Beneficiário" : "Novo Funcionário"} */}
                        </DialogTitle>
                    </DialogHeader>

                    <FormEmpresa initialData={empresa} onSubmit={handleEdit} />

                </DialogContent>
            </Dialog>

        </div>
    );
}

type Props = {
    form: UseFormReturn<EmpresaFormData>;
};


// =======================================================
// 1. ZOD SCHEMA E TIPAGEM
// =======================================================

export const EmpresaSchema = z.object({
    // ID é opcional no formulário (não é preenchido manualmente)
    id: z.string().optional(), 
    nome: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
    cnpj: z.string().optional(),
});

export type EmpresaFormData = z.infer<typeof EmpresaSchema>;

// =======================================================
// 2. INTERFACE DE PROPS
// =======================================================

interface FormEmpresaProps {
    // initialData é opcional: se presente, é Edição; se não, é Cadastro.
    initialData?: EmpresaFormData; 
    // Função para tratar o submit (recebe os dados validados)
    onSubmit: (data: EmpresaFormData) => void; 
    // Opcional: função para fechar o modal/dialog, se aplicável
    onCancel?: () => void; 
}


// =======================================================
// 3. COMPONENTE REUTILIZÁVEL (FormEmpresa)
// =======================================================

export function FormEmpresa({ initialData, onSubmit, onCancel }: FormEmpresaProps) {
    
    // 💡 Lógica para determinar o modo:
    const isEditMode = !!initialData?.id; 

    const form = useForm<EmpresaFormData>({
        // Usamos o EmpresaSchema para ambos, pois ele já espera o 'id' opcional.
        resolver: zodResolver(EmpresaSchema),
        
        // **Preenchimento Automático para Edição**
        defaultValues: {
            // O RHF cuida de preencher 'id' e 'nome' se initialData for fornecido.
            id: initialData?.id || undefined, 
            nome: initialData?.nome || "",
        }
    });

    const handleSubmit = (data: EmpresaFormData) => {
        // Você pode fazer qualquer manipulação final aqui antes de chamar o prop onSubmit
        onSubmit(data);
    };

    return (
        // O Form do shadcn/ui (que usa FormProvider do RHF)
        <Form {...form} >
            <form
                // **CORREÇÃO:** Conectando a função de submit do RHF
                onSubmit={form.handleSubmit(handleSubmit)} 
                className="space-y-6 p-1"
            >
                <Card>
                    <CardHeader>
                        <CardTitle>1. Informações da Empresa</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        
                        {/* Campo Nome */}
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-2">
                                    <FormLabel>Nome da Empresa</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Ex: Minha Empresa Ltda." 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <DialogFooter>
                    {/* Botão de Cancelar Edição/Cadastro */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel} // Chama a função de cancelar passada via prop
                    >
                        {isEditMode ? "Cancelar Edição" : "Cancelar"}
                    </Button>

                    {/* Botão de Submissão Principal */}
                    <Button
                        type="submit"
                        // Desabilitar enquanto submete (opcional)
                        disabled={form.formState.isSubmitting} 
                    >
                        {/* **CORREÇÃO:** Label dinâmico para Cadastro ou Edição */}
                        {isEditMode ? "Salvar Alterações" : "Cadastrar Empresa"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
