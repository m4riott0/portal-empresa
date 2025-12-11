import InputWithDropdown from "@/components/InputWithDropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, CirclePlus, MoveLeft, MoveRight, Pencil, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { set, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";



type Usuario = {
    cd_conta: number,
    nm_usuario: string,
    nm_operador: string,
    cd_tipo_perfil: number,
    cd_empresa_bs: number,
    sn_ativo: string
}

type Empresa = {
    cd_empresa: number,
    ds_empresa: string,
}

export default function Usuarios() {

    const [loading, setLoading] = useState(false);
    const [loadingButton, setLoadingButton] = useState<"usuario" | "desativar" | "enviar" | null>(null);
    const [openModal, setOpenModal] = useState<"usuario" | "desativar" | "enviar" | null>(null);

    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [usuarios, setUsuarios] = useState<Usuario[] | []>([]);

    const [empresas, setEmpresas] = useState<Empresa[] | []>([]);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        carregarUsuarios(page);
    }, [page]);

    async function carregarUsuarios(pageNumber) {

        setLoading(true)
        await api.get(`/Usuarios?page=${pageNumber}&pageSize=${pageSize}`).then(response => {

            const data = response.data.data;

            const currentPage = parseInt(response.headers["x-page"]);
            const pageSizeHeader = parseInt(response.headers["x-pagesize"]);
            const totalCount = parseInt(response.headers['x-total-count']);

            const total = Math.ceil(totalCount / pageSizeHeader);

            setUsuarios(data);
            setPage(currentPage);
            setTotalPages(total);
        }).finally(() => {
            setLoading(false)
        });

    }

    function nextPage() {
        if (page < totalPages) setPage(page + 1);
    }

    function prevPage() {
        if (page > 1) setPage(page - 1);
    }


    const handleNewUser = async () => {

        setLoadingButton("usuario");

        //TODO passar mais de 3 caracteres

        setEmpresas([
            { cd_empresa: 1, ds_empresa: "Empresa A" },
            { cd_empresa: 2, ds_empresa: "Empresa B" },
            { cd_empresa: 4, ds_empresa: "Empresa B" },
            { cd_empresa: 5, ds_empresa: "Empresa B" },
            { cd_empresa: 6, ds_empresa: "Empresa B" },
            { cd_empresa: 7, ds_empresa: "Empresa B" },
            { cd_empresa: 8, ds_empresa: "Empresa B" },
            { cd_empresa: 9, ds_empresa: "Empresa B" },
            { cd_empresa: 3, ds_empresa: "Empresa C" },
        ])
        // await api.get(`/Empresa?page=1&pageSize=100`).then(response => {
        //     setEmpresas(response.data.data);
        // })
        //     .finally(() => { setLoadingButton(null); });

        setUsuario(null);
        setOpenModal("usuario");
    };

    const handleEdit = (data: UsuarioFormData) => {
        console.log("Dados para EDIÇÃO:", data); // data incluirá o ID
        // Chamada API: fetch('/api/empresas/' + data.id, { method: 'PUT', body: JSON.stringify(data) });
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }


    return (
        <div className="space-y-8">

            {/* CARD DA TABELA */}
            <Card className="w-full max-w-6xl mx-auto">

                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CardTitle>Usuários</CardTitle>
                    </div>
                    <CardDescription>
                        Cadastrar/Editar usuários.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-5">
                    <Button className="btn-medical" onClick={handleNewUser} isLoading={loadingButton == "usuario"} disabled={loadingButton === "usuario"}>
                        <CirclePlus className="mr-2 h-4 w-4" /> Novo Usuário
                    </Button>
                    {
                        (!usuarios.length) ?
                            (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhuma usuário encontrado.
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
                                                        Usuario
                                                    </TableHead>
                                                    <TableHead>
                                                        Empresa
                                                    </TableHead>

                                                    <TableHead className="text-center">
                                                        Ações
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {usuarios.map((usuario: Usuario) => (
                                                    <TableRow key={usuario.cd_conta} className="hover:bg-muted/50">

                                                        <TableCell className="text-muted-foreground items-center">
                                                            {usuario.nm_operador} - {usuario.cd_tipo_perfil} <br />
                                                            {/* {usuario.email} */}
                                                            Email
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground items-center">
                                                            {usuario.cd_empresa_bs}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-center">


                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                hoverText={`${usuario.sn_ativo == 'S' ? "Ativar" : "Inativar"} usuário.`}
                                                                onClick={() => {
                                                                    setOpenModal("desativar")
                                                                }}
                                                            >
                                                                {usuario.sn_ativo == 'S' ? (<Check className="h-4 w-4" />) : (<X className="h-4 w-4" />)}
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                hoverText="Enviar email credenciais."
                                                                onClick={() => {
                                                                    setOpenModal("enviar")
                                                                }}
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                hoverText="Editar usuário."
                                                                onClick={() => {
                                                                    setUsuario(
                                                                        {
                                                                            nm_usuario: "Usuario X",
                                                                            cd_empresa_bs: 5,
                                                                            cd_conta: 9,
                                                                            nm_operador: "vdd",
                                                                            cd_tipo_perfil: 1,
                                                                            sn_ativo: "S"
                                                                        }
                                                                    )
                                                                    setOpenModal("usuario")
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>


                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div style={{ marginTop: 20 }}>
                                        <Button variant="outline" onClick={prevPage} disabled={page === 1}>
                                            <MoveLeft className="h-4 w-4" />Anterior
                                        </Button>

                                        <span style={{ margin: "0 15px" }}>
                                            Página {page} de {totalPages}
                                        </span>

                                        <Button variant="outline" onClick={nextPage} disabled={page === totalPages}>
                                            Próxima <MoveRight className="h-4 w-4" />
                                        </Button>

                                    </div>

                                </>
                            )
                    }
                </CardContent>
            </Card>

            {/* DIALOG DE ATIVAR/DESATIVAR USUARIO */}
            <Dialog
                open={openModal == "desativar"}
                onOpenChange={() => { setOpenModal(null) }}
            >
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {usuario ? "Ativar" : "Inativar"} usuário
                        </DialogTitle>
                    </DialogHeader>


                    <Card>
                        <CardHeader>
                            <Label className="font-semibold">email de credenciais</Label>

                            <span className="text-xs text-gray-500">
                                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It ha
                            </span>
                        </CardHeader>

                        <CardContent>
                            <Button
                                className="mt-4 w-full"
                            // onClick={handleNewPermissions}
                            // isLoading={loadingButton === "salvar"}
                            // disabled={loadingButton === "salvar"}
                            >
                                Enviar
                            </Button>

                        </CardContent>
                    </Card>

                </DialogContent>
            </Dialog>

            {/* DIALOG DE ENVIAR CREDENCIAMENTOS DO USUARIO */}
            <Dialog
                open={openModal == "enviar"}
                onOpenChange={() => { setOpenModal(null) }}
            >
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            Ação para enviar email credenciais
                        </DialogTitle>
                    </DialogHeader>

                    <Card>
                        <CardHeader>
                            <Label className="font-semibold">email de credenciais</Label>

                            <span className="text-xs text-gray-500">
                                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It ha
                            </span>
                        </CardHeader>

                        <CardContent>
                            <Button
                                className="mt-4 w-full"
                            // onClick={handleNewPermissions}
                            // isLoading={loadingButton === "salvar"}
                            // disabled={loadingButton === "salvar"}
                            >
                                Enviar
                            </Button>

                        </CardContent>
                    </Card>

                </DialogContent>
            </Dialog>

            {/* DIALOG DE CADASTRAO/EDICAO USUARIO*/}
            <Dialog
                // overflow-visible
                open={openModal == "usuario"}
                onOpenChange={() => { setOpenModal(null) }}
            >
                <DialogContent
                    className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {usuario ? "Editar Beneficiário" : "Novo Funcionário"}
                        </DialogTitle>
                    </DialogHeader>

                    <FormEmpresa initialData={usuario} empresas={empresas} onSubmit={handleEdit} />

                </DialogContent>
            </Dialog>

        </div>
    );
}

type Props = {
    form: UseFormReturn<UsuarioFormData>;
};


// =======================================================
// 1. ZOD SCHEMA E TIPAGEM
// =======================================================

export const UsuarioSchema = z.object({
    // ID é opcional no formulário (não é preenchido manualmente)
    cod_usuario: z.string().optional(),
    cod_empresa: z.string().optional(),
    nome: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
    usuario: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
    email: z.string().email("Email inválido."),
});



export type UsuarioFormData = z.infer<typeof UsuarioSchema>;

// =======================================================
// 2. INTERFACE DE PROPS
// =======================================================

interface FormEmpresaProps {
    empresas?: Empresa[];
    // initialData é opcional: se presente, é Edição; se não, é Cadastro.
    // initialData?: UsuarioFormData;
    initialData?: Usuario | null;
    // Função para tratar o submit (recebe os dados validados)
    onSubmit: (data: UsuarioFormData) => void;
    // Opcional: função para fechar o modal/dialog, se aplicável
    onCancel?: () => void;
}


// =======================================================
// 3. COMPONENTE REUTILIZÁVEL (FormEmpresa)
// =======================================================

export function FormEmpresa({ initialData, onSubmit, onCancel, empresas }: FormEmpresaProps) {

    // 💡 Lógica para determinar o modo:
    const isEditMode = !!initialData?.cd_conta;

    const form = useForm<UsuarioFormData>({
        // Usamos o EmpresaSchema para ambos, pois ele já espera o 'id' opcional.
        resolver: zodResolver(UsuarioSchema),

        // **Preenchimento Automático para Edição**
        defaultValues: {
            // O RHF cuida de preencher 'id' e 'nome' se initialData for fornecido.
            nome: initialData?.nm_operador || "",
        }
    });

    const handleSubmit = (data: UsuarioFormData) => {
        // Você pode fazer qualquer manipulação final aqui antes de chamar o prop onSubmit
        onSubmit(data);
    };

    function normalizeString(str: string) {
        return str
            .normalize("NFD")            // separa acentos
            .replace(/[\u0300-\u036f]/g, "") // remove acentos
            .toLowerCase();             // deixa tudo minúsculo
    }

    const [empresaSelecionada, setEmpresaSelecionada] = useState<number | string | null>(null);
    console.log("empresaSelecionada:", empresaSelecionada);

    const empresass = [
        { index: 1, texto: "Empresa Alpha" },
        { index: 2, texto: "Empresa Beta" },
        { index: 3, texto: "Empresa Gama" },
        { index: 4, texto: "Empresa Gama" },
        { index: 5, texto: "Empresa Gama" },
        { index: 6, texto: "Empresa Gama" },
        { index: 7, texto: "Empresa Gama" },
        { index: 8, texto: "Empresa Gama" },
        { index: 9, texto: "Empresa Gama" },
        { index: 10, texto: "Empresa Gama" },
        { index: 11, texto: "Empresa Gama" },
    ];

    return (

        <Form {...form} >
            <form
                // **CORREÇÃO:** Conectando a função de submit do RHF
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 p-1"
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Usuário</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* Campo Nome */}
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-1">
                                    <FormLabel>Nome de Usuário</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Ana."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Campo Nome de login */}
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-2">
                                    <FormLabel>Nome Completo</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Ana Maria"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Campo Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-2">
                                    <FormLabel>Email de acesso do usuário</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: bensaude@bensaude.com.br"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* SELECT DE EMPRESAS */}

                        <FormField

                            control={form.control}
                            name="cod_empresa"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-1">
                                    <FormLabel>Empresa</FormLabel>
                                    <FormControl>
                                      <InputWithDropdown
                                        // itens={empresass}
                                        value={empresaSelecionada}
                                        onChange={(val) => setEmpresaSelecionada(val)}
                                        placeholder="Selecione a empresa..."
                                        processar={async (valor: string, signal: AbortSignal) => {

                                            // Fazer requisição à API para buscar empresas
                                            // const response = await api.get(`/Empresa?search=${valor}`, { signal });
                                            // return response.data.data;
                                            return empresass
                                        }}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />




                    </CardContent>
                </Card>

                <DialogFooter>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        {isEditMode ? "Cancelar Edição" : "Cancelar"}
                    </Button>

                    <Button
                        type="submit"
                        // Desabilitar enquanto submete (opcional)
                        disabled={form.formState.isSubmitting}
                    >
                        {isEditMode ? "Salvar Alterações" : "Cadastrar"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
