import InputWithDropdown, { DropdownItem, InputWithDropdownRef } from "@/components/InputWithDropdown";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Empresa, Usuario } from "@/types";
import { normalizeValue } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CirclePlus, MoveLeft, MoveRight, Pencil, Search, Send, X, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// PERFILS QUE ACESSARA ESTA TELA:    ADMINISTRADOR | COMERCIAL | ADMINISTRADOR DE RECURSOS HUMANOS - RH


// TODO : VALIDAR SE O USUARIO LOGADO TEM PERFIL PARA ACESSAR ESTA TELA
// TODO : AO CARREGAR A GRID NÃO DEIXA SE INATIVAR, APENAS OUTROS USUARIOS


export default function Usuarios() {

    const navigate = useNavigate();

    const [perfils, setPerfils] = useState<"ADMINISTRADOR" | "COMERCIAL" | "ADMINISTRADOR DE RECURSOS HUMANOS - RH">("ADMINISTRADOR");

    const [loading, setLoading] = useState(false);
    const [loadingButton, setLoadingButton] = useState<"consultar" | "usuario" | "ativar/inativar" | "enviar" | null>(null);
    const [openModal, setOpenModal] = useState<"usuario" | "ativar/inativar" | "enviar" | null>(null);

    const [codPlano, setCodPlano] = useState<number | string | null>(null);

    const [usuario, setUsuario] = useState<Usuario>({} as Usuario);
    const [usuarios, setUsuarios] = useState<Usuario[] | []>([]);

    // Campos de pesquisa
    const [nomeUsuario, setNomeUsuario] = useState<string>("");
    const [codPlanoPesquisado, setPlanoPesquisado] = useState<number | string | null>(""); // O codigo do plano pesquisado é o campo de pesquisa da empresa
    const inputRefEmpresa = useRef<InputWithDropdownRef>(null);
    const [statusSelected, setStatusSelected] = useState<string>("A");
    const status = [{index:'A', text:'Ambos'}, {index:'S', text:'Ativos'}, {index:'N', text:'Inativos'}];

    //Paginação
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);


    useEffect(() => {
        if (page !== 0)
            carregarUsuarios(page);
    }, [page]);

    async function carregarUsuarios(pageNumber, cod_plano = null) {

        setLoadingButton("consultar")
        cod_plano = cod_plano ? cod_plano : codPlano
        const filtroCodPlano = cod_plano ? `&CdPlano=${cod_plano}` : '';
        const filtroNomeUsuario = !!nomeUsuario ? `&NmUsuario=${nomeUsuario}` : "";
        const filtroStatus = statusSelected && statusSelected !== "A" ? `&SnAtivo=${statusSelected == "S"}` : "";

        await api.get(`/Usuarios?page=${pageNumber}&pageSize=${pageSize}${filtroCodPlano}${filtroNomeUsuario}${filtroStatus}`).then(response => {

            const data = response.data.data;

            const currentPage = parseInt(response.headers["x-page"]);
            const pageSizeHeader = parseInt(response.headers["x-pagesize"]);
            const totalCount = parseInt(response.headers['x-total-count']);

            const total = Math.ceil(totalCount / pageSizeHeader);

            setUsuarios(data);
            setPage(currentPage);
            setTotalPages(total);
        }).finally(() => {
            setLoadingButton(null)
        });

    }

    function nextPage() {
        if (page < totalPages) setPage(page + 1);
    }

    function prevPage() {
        if (page > 1) setPage(page - 1);
    }

    const handleClickSearch = () => {

        const inputValue = inputRefEmpresa.current.getValue().trim();
        // TODO aplicar mais uma condição para quando for RH ignora está validação
        if (inputValue !== "" && !codPlanoPesquisado) {
            return toast({ title: "O campo razão social está inválido.", variant: "destructive" });
        }

        carregarUsuarios(1, inputValue === "" ? null : codPlanoPesquisado);
    }

    const handleUsuario = async (data: UsuarioFormData & { cod_plano: number }, isEdicao: boolean) => {

        setLoadingButton("usuario");

        const payload = {
            nm_usuario: data.nome_login,
            nm_operador: data.nome_completo,
            ds_email: data.email,
            ...(!isEdicao && { cd_plano: data.cod_plano }),
        };

        if (isEdicao) {
            await api.put(`/Usuarios/${usuario.cd_conta}`, payload).finally(() => { setLoadingButton(null) });
            toast({ title: "Usuário atualizado com sucesso." });
        } else {
            await api.post('/Usuarios', payload).finally(() => { setLoadingButton(null) });
            toast({ title: "Usuário cadastrado com sucesso." });
        }

        carregarUsuarios(1);
        setOpenModal(null);
    };

    const handleAtivarInativarUsuario = async () => {

        setLoadingButton("ativar/inativar");
        await api.patch(`/Usuarios/${usuario.cd_conta}`, { sn_ativo: usuario?.sn_ativo == 'N' ? 'S' : 'N' }).finally(() => { setLoadingButton(null) });

        toast({ title: `Usuário ${usuario?.sn_ativo == 'S' ? "inativado" : "ativado"} com sucesso.` });
        carregarUsuarios(1);
        setOpenModal(null);
    }

    const handleEnviarCredenciais = async () => {

        setLoadingButton("enviar");
        await api.post(`/Usuarios/enviar-credenciais`, { cd_conta: usuario.cd_conta }).finally(() => { setLoadingButton(null) });

        toast({ title: "Dados enviados para o email do usuário." });
        carregarUsuarios(1);
        setOpenModal(null);
    }

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
                    <Button className="btn-medical"
                        onClick={() => {
                            setUsuario(null);
                            setOpenModal("usuario");
                        }}>
                        <CirclePlus className="mr-2 h-4 w-4" /> Novo Usuário
                    </Button>

                    <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:items-end">
                        <div className="flex flex-col flex-1 max-w-sm">
                            {/* <Label>Nome de usuário</Label> */}
                            {/* <div className="relative"> */}
                            {/* <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /> */}
                            <Input
                                value={nomeUsuario}
                                onChange={(e) => setNomeUsuario(e.target.value)}
                                placeholder="Pesquisar por nome de usuário..."

                            // className="pl-8"
                            />
                            {/* </div> */}
                        </div>
                        {/* TODO - Fazer este campo ser ocultado quando for um RH normal */}
                        <div className="flex-1 max-w-sm">

                            <InputWithDropdown
                                ref={inputRefEmpresa}
                                value={codPlanoPesquisado}
                                onChange={(item: DropdownItem) => setPlanoPesquisado(item.index)}
                                placeholder="Pesquise pela razão social"
                                processar={async (valor: string, signal: AbortSignal) => {
                                    
                                    // Fazer requisição à API para buscar empresas
                                    const response = await api.get(`/Empresa?page=1&pageSize=20&DsRazaoSocial=${valor}`, { signal });
                                    const empresasEncontradas = response.data.data;
                                    return empresasEncontradas?.map((item: Empresa) => ({ index: item.cd_plano, texto: item.ds_razao_social }));
                                }} />

                        </div>

                        <div className="">
                            <Select
                                value={statusSelected}
                                onValueChange={setStatusSelected}                        
                            >
                                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    {status.map(item => (<SelectItem key={item.index} value={item.index}>{item.text}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 max-w-sm">
                            <Button variant="outline"
                                onClick={() => {                                    
                                    inputRefEmpresa.current.clear();
                                    setNomeUsuario("");
                                    setPlanoPesquisado("");
                                    setStatusSelected("A");
                                }}>
                                <XIcon className="mr-2 h-4 w-4" />
                                Limpar Filtros
                            </Button>
                        </div>
                        <div className="sm:ml-auto self-end">

                            <Button
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                                onClick={() => handleClickSearch()}
                                isLoading={loadingButton === "consultar"}
                                disabled={loadingButton === "consultar"}
                            >
                                <Search className="mr-2 h-4 w-4" /> Consultar
                            </Button>
                        </div>
                    </div>

                    {
                        (!usuarios.length) ?
                            (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhuma usuário encontrado.
                                </p>
                            ) :
                            (
                                <>
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
                                                            {usuario.nm_operador} <br />
                                                            {usuario.ds_email}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground items-center">
                                                            {usuario.ds_empresa}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-center">


                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                hoverText={`${usuario?.sn_ativo == 'S' ? "Ativar" : "Inativar"} usuário.`}
                                                                onClick={() => {
                                                                    setUsuario(usuario);
                                                                    setOpenModal("ativar/inativar")
                                                                }}
                                                            >
                                                                {usuario?.sn_ativo == 'S' ? (<Check className="h-4 w-4 text-primary" />) : (<X className="h-4 w-4 text-danger" />)}
                                                            </Button>

                                                            {usuario.sn_troca_senha == 'S' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    hoverText="Enviar email credenciais."
                                                                    onClick={() => {
                                                                        setUsuario(usuario);
                                                                        setOpenModal("enviar")
                                                                    }}
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                hoverText="Editar usuário."
                                                                onClick={() => {
                                                                    setUsuario(usuario);
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

            {/* DIALOG DE CADASTRAO/EDICAO USUARIO*/}
            <Dialog
                open={openModal == "usuario"}
                onOpenChange={() => { setOpenModal(null) }}
            >
                <DialogContent
                    className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {usuario ? "Editar" : "Cadastrar"} usuário da empresa {usuario?.ds_empresa}
                        </DialogTitle>
                    </DialogHeader>

                    <FormUsuario
                        initialData={usuario}
                        onSubmit={handleUsuario}
                        onCancel={() => { setOpenModal(null) }}
                        loading={loadingButton == 'usuario'}
                    />

                </DialogContent>
            </Dialog>

            {/* DIALOG DE ATIVAR/INATIVAR USUARIO */}
            <Dialog
                open={openModal == "ativar/inativar"}
                onOpenChange={() => { setOpenModal(null) }}
            >
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {usuario?.sn_ativo == 'N' ? "Ativar" : "Inativar"} usuário
                        </DialogTitle>
                    </DialogHeader>


                    <Card>
                        <CardHeader>
                            <span className="text-gray-500">
                                O usuário <b>{usuario?.nm_operador}</b> será {usuario?.sn_ativo == 'N' ? "ativado" : "inativado"}
                            </span>
                        </CardHeader>

                        <CardContent>
                            <Button
                                className="mt-4 w-full"
                                onClick={handleAtivarInativarUsuario}
                                isLoading={loadingButton === "ativar/inativar"}
                                disabled={loadingButton === "ativar/inativar"}
                            >
                                {usuario?.sn_ativo == 'N' ? "Ativar" : "Inativar"}
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
                            <Label className="font-semibold">Email de credenciais</Label>

                            <span className="text-xs text-gray-500">
                                Ao clicar em <b>“Enviar”</b>, o usuário cadastrado receberá no e-mail informado os dados para o primeiro acesso, incluindo login e senha.
                                <br />
                                <br />
                                email: <b>{usuario?.ds_email}</b>
                            </span>
                        </CardHeader>

                        <CardContent>
                            <Button
                                className="mt-4 w-full"
                                onClick={handleEnviarCredenciais}
                                isLoading={loadingButton === "enviar"}
                                disabled={loadingButton === "enviar"}
                            >
                                Enviar
                            </Button>

                        </CardContent>
                    </Card>

                </DialogContent>
            </Dialog>


        </div >
    );
}

// =======================================================
// ZOD SCHEMA E TIPAGEM
// =======================================================

export const createUsuarioSchema = (codPlano?: number | null) => z
    .object({
        cod_usuario: z.string().optional(),
        nome_login: z
            .string()
            .min(3, "O nome para login deve ter no mínimo 3 caracteres.")
            .max(100, "O nome para login deve ter no máximo 100 caracteres."),
        nome_completo: z
            .string()
            .min(3, "O nome completo deve ter no mínimo 3 caracteres.")
            .max(100, "O nome completo deve ter no máximo 100 caracteres."),
        email: z
            .string()
            .email("Email inválido.")
            .max(200, "O email deve ter no máximo 200 caracteres."),
        empresa: z.string().optional(),
    })
    .refine(
        (data) => {
            return !!codPlano && !!data.empresa
        },
        {
            message: "A empresa deve ser informada.",
            path: ["empresa"],
        }
    );

export type UsuarioFormData = z.infer<
    ReturnType<typeof createUsuarioSchema>
>;

// =====================
// PROPS
// =====================

interface FormUsuarioProps {
    // initialData é opcional: se presente, é Edição; se não, é Cadastro.
    initialData?: Usuario | null;
    // Função para tratar o submit (recebe os dados validados)
    onSubmit: (data: UsuarioFormData, isEditMode: boolean) => void;
    // Opcional: função para fechar o modal/dialog, se aplicável
    onCancel?: () => void;
    loading?: boolean;
}

// =====================
// COMPONENTE
// =====================

export function FormUsuario({ initialData, onSubmit, onCancel, loading }: FormUsuarioProps) {

    // 💡 Lógica para determinar o modo:
    const isEditMode = !!initialData?.cd_conta;
    const [codPlano, setCodPlano] = useState<number>(initialData?.cd_plano || 0);

    const form = useForm<UsuarioFormData>({
        resolver: zodResolver(createUsuarioSchema(codPlano)),
        // **Preenchimento Automático para Edição**
        defaultValues: {
            nome_login: initialData?.nm_usuario || "",
            nome_completo: initialData?.nm_operador || "",
            email: initialData?.ds_email || "",
            empresa: initialData?.ds_empresa || ""
        },
        mode: "onSubmit",
    });

    const handleSubmit = (data: UsuarioFormData & { cod_plano: number }) => {
        data.cod_plano = codPlano;
        onSubmit(data, isEditMode);
    };

    return (
        <Form {...form} >
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 p-1"
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Usuário</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* CAMPO NOME DE LOGIN */}
                        <FormField
                            control={form.control}
                            name="nome_login"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-1">
                                    <FormLabel>Nome para login</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="EX: ANA"
                                            maxLength={100}
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(normalizeValue(e.target.value));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* CAMPO NOME COMPLETO */}
                        <FormField
                            control={form.control}
                            name="nome_completo"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-2">
                                    <FormLabel>Nome Completo</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="EX: ANA MARIA"
                                            maxLength={100}
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(normalizeValue(e.target.value));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* CAMPO EMAIL */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-2">
                                    <FormLabel>Email de acesso do usuário</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            maxLength={200}
                                            placeholder="ex: bensaude@bensaude.com.br"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(normalizeValue(e.target.value, "email"));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* SELECT DE EMPRESA */}
                        <FormField
                            control={form.control}
                            name="empresa"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-1">
                                    <FormLabel>Razão Social</FormLabel>
                                    <FormControl>
                                        {isEditMode ? (<Input disabled value={initialData.ds_empresa} />) : (
                                            <>
                                                <InputWithDropdown
                                                    value={codPlano}
                                                    placeholder="PESQUISE PELA RAZÃO SOCIAL"
                                                    onChange={(item: DropdownItem) => {
                                                        // texto → formulário
                                                        field.onChange(item.texto);

                                                        // código → estado
                                                        setCodPlano(Number(item.index));

                                                        // limpa erro manualmente
                                                        form.clearErrors("empresa");
                                                    }}
                                                    processar={async (valor: string, signal: AbortSignal) => {

                                                        // Fazer requisição à API para buscar empresas
                                                        const response = await api.get(`/Empresa?page=1&pageSize=20&DsRazaoSocial=${valor}`, { signal });
                                                        const empresasEncontradas = response.data.data;
                                                        return empresasEncontradas?.map(item => ({ index: item.cd_plano, texto: item.ds_razao_social }));
                                                    }} />
                                            </>
                                        )}
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
                        disabled={loading}
                        isLoading={loading}

                    >
                        {isEditMode ? "Salvar Alterações" : "Cadastrar"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
