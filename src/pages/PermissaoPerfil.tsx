import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { ArrowUpDown, Briefcase, CirclePlus, Pencil, Search, Table as TableIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { set } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";


interface payloadConnectPermissions {
    codigoPermissao: number;
    codigoPerfil: number;
    status: boolean;
}

interface TipoPerfil {
    codigo: number;
    descricao: string;
}

interface Permission {
    codigo: number;
    descricao: string;
    status: boolean;
}

export default function PermissaoPerfil() {

    const [loading, setLoading] = useState(false);
    const [loadingButton, setLoadingButton] = useState<"salvar" | "alterar" | "vincular" | null>(null); ''

    const [openModal, setOpenModal] = useState<null | "newPermission" | "bindPermission" | "alterPermission">(null)

    const [Message, setMessage] = useState("")
    const [payload, setPayload] = useState<payloadConnectPermissions>({ codigoPerfil: 0, codigoPermissao: 0, status: false })
    const [idPerfil, setIdPerfil] = useState("")
    const [tipoPerfils, setTipoPerfils] = useState<TipoPerfil[] | []>([])

    const [permission, setPermission] = useState<Permission | null>(null);
    const [permissions, setPermissions] = useState<Permission[] | []>([]);
    const [permissionsFilter, setPermissionsFilter] = useState<Permission[] | []>([]);


    const inputNamePermissionRef = useRef(null);

    useEffect(() => {

        async function listarPerfils() {
            setLoading(true);
            try {
                const response = await api.get("/Permissoes/ListarPerfis");
                setTipoPerfils(response.data)
            } catch (e) {

            } finally {
                setLoading(false);
            }
        }

        listarPerfils();
    }, []);

    async function pesquisarPermissoes(perfilId: string) {

        try {
            setLoading(true);
            const response = await api.get(`/Permissoes/ListarPermissoesVinculadas/${perfilId}`);
            setPermissions(response.data)
            setPermissionsFilter(response.data)
        } catch (e) {
            toast({
                title: "Erro ao enviar código",
                description: "Erro ao carregar a lista de permissões",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }

    }

    const handleCompanyChange = async (perfilId: string) => {
        setIdPerfil(perfilId)
        await pesquisarPermissoes(perfilId)
    };

    const handleCheckboxChange = (id: number, value: boolean | "indeterminate") => {
        const checked = !!value
        const perfil = tipoPerfils.find((item: TipoPerfil) => item.codigo === parseInt(idPerfil))
        const permission = permissions.find((item: Permission) => item.codigo === id)

        setPayload({
            codigoPerfil: perfil.codigo,
            codigoPermissao: id,
            status: checked
        })

        setMessage(`A permissão <b>${permission.descricao}</b> será <b>${checked ? 'vinculada</b> ao' : 'desvinculada</b> do'} perfil ${perfil.descricao}`)
        setOpenModal("bindPermission")
    }

    const handleChange = (e) => {
        setPermissionsFilter(permissions.filter((permission: Permission) =>
            permission.descricao.toLowerCase().includes(e.target.value.toLowerCase())
        ));
    }

    const handleConnectPermissions = useCallback(async () => {

        setLoadingButton("vincular");
        await api.put("/Permissoes/VincularPerfil", payload)
            .then(async (res) => {
                const msgStatus = payload.status ? "vinculada" : "desvinculada";
                toast({
                    title: `Permissão ${msgStatus} com sucesso`,
                    description: `Permissão ${msgStatus} ao perfil com sucesso.`,
                });

                await pesquisarPermissoes(String(payload.codigoPerfil))
                setOpenModal(null);
            })
            .finally(async () => {

                setLoadingButton(null);
            });

    }, [payload]);

    const handleNewPermissions = async () => {

        setLoadingButton("salvar");

        if (inputNamePermissionRef.current.value.trim() === "") {
            toast({ title: "Erro", description: "O nome da permissão não pode estar vazio.", variant: "destructive" });
            setLoadingButton(null);
            return false
        }

        await api.post("/Permissoes/CriarPermissao", {
            dsPermissao: inputNamePermissionRef.current.value
        })
            .then(async (res) => {

                toast({ title: `Permissão cadastrada com sucesso` });

                if (!!idPerfil) {
                    await pesquisarPermissoes(idPerfil)
                }

                setOpenModal(null);
            })
            .finally(() => setLoadingButton(null))

    }

    const handleAlterPermissions = async () => {

        setLoadingButton("alterar");


        if (inputNamePermissionRef.current.value.trim() === "") {
            toast({ title: "Erro", description: "O nome da permissão não pode estar vazio.", variant: "destructive" });
            setLoadingButton(null);
            return false
        }


        await api.patch("/Permissoes/EditarPermissao", {
            codigo: permission.codigo,
            descricao: inputNamePermissionRef.current.value
        })
            .then(async (res) => {

                toast({ title: `Permissão atualizada com sucesso` });

                if (!!idPerfil) {
                    await pesquisarPermissoes(idPerfil)
                }

                setOpenModal(null);
            })
            .finally(() => setLoadingButton(null))

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

            {/* CARD DO SELECT */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CardTitle>Permissão de tipos de perfil</CardTitle>
                    </div>
                    <CardDescription>
                        Vincular permissões aos tipos de perfil.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex items-center justify-between">
                    <Select value={idPerfil} onValueChange={handleCompanyChange}>
                        <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                            <SelectValue placeholder="Selecione um tipo de perfil..." />
                        </SelectTrigger>

                        <SelectContent>
                            {tipoPerfils.map(perfil => (
                                <SelectItem key={perfil.codigo} value={perfil.codigo}>
                                    {perfil.descricao}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>


                    <Button className="btn-medical" onClick={() => setOpenModal("newPermission")}>
                        <CirclePlus className="mr-2 h-4 w-4" /> Nova Permissão
                    </Button>
                </CardContent>
            </Card>

            {/* CARD DA TABELA */}
            <Card>
                <CardContent className="space-y-6 pt-5">
                    {
                        !idPerfil ?
                            (
                                <p className="text-center text-muted-foreground py-8">
                                    Selecione um tipo de perfil para ver as suas permissões.
                                </p>
                            ) :
                            (
                                <>
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Pesquisar por nome..."
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>

                                    {
                                        !!permissionsFilter.length ? (
                                            <div className="border rounded-md my-5 ">
                                                <Table className="w-full">
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>
                                                                {/* <Button variant="ghost" className="px-0"> */}
                                                                Competência
                                                                {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
                                                                {/* </Button> */}
                                                            </TableHead>

                                                            <TableHead className="text-center w-[220px]">
                                                                {/* <Button variant="ghost" className="px-0"> */}
                                                                Status
                                                                {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
                                                                {/* </Button> */}
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>

                                                    <TableBody>
                                                        {permissionsFilter.map((permissao) => (
                                                            <TableRow key={permissao.codigo} className="hover:bg-muted/50">

                                                                <TableCell className="text-muted-foreground flex items-center">
                                                                    {permissao.descricao}

                                                                    <HoverCard openDelay={0} closeDelay={0}>
                                                                        <HoverCardTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="flex items-center gap-2"
                                                                                onClick={() => {
                                                                                    setPermission(permissao)
                                                                                    setOpenModal("alterPermission")
                                                                                }}
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>
                                                                        </HoverCardTrigger>

                                                                        <HoverCardContent className="w-60 text-sm">
                                                                            Editar Permissão.
                                                                        </HoverCardContent>
                                                                    </HoverCard>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground text-center !pr-4">
                                                                    <Checkbox
                                                                        checked={permissao.status}
                                                                        onCheckedChange={(v) => handleCheckboxChange(permissao.codigo, v)}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">
                                                Nenhuma permissão encontrada
                                            </p>
                                        )
                                    }
                                </>
                            )
                    }
                </CardContent>
            </Card>

            {/* DIALOG DE CONFIRMAÇÃO */}
            <Dialog open={openModal === 'bindPermission'} onOpenChange={(v) => setOpenModal(v ? "bindPermission" : null)}>
                <DialogContent>
                    <VisuallyHidden><DialogTitle /></VisuallyHidden>
                    <DialogHeader>
                        <DialogDescription
                            className="pt-2 text-lg text-black break-normal"
                            dangerouslySetInnerHTML={{ __html: Message }}
                        />
                    </DialogHeader>
                    <Button 
                        className="mt-4"
                        onClick={handleConnectPermissions}
                        children="Continuar"
                        disabled={loadingButton === 'vincular'} 
                        isLoading={loadingButton === 'vincular'}
                        ></Button>
                </DialogContent>
            </Dialog>

            {/* DIALOG DE CADASTRO/ALTERAÇÃO DA PERMISSÃO */}
            <Dialog
                open={openModal === 'newPermission' || openModal === 'alterPermission'}
                onOpenChange={(v) => setOpenModal(v ? (openModal === 'newPermission' ? "newPermission" : "alterPermission") : null)}>
                <DialogContent>
                    <DialogTitle>{openModal === 'newPermission' ? "Cadastrar" : "Alterar"}  Permissão</DialogTitle>
                    <Card>
                        <CardHeader>
                            <Label className="font-semibold">Nome da Permissão</Label>

                            <Input
                                placeholder="Ex: CADASTRAR_BENEFICIARIO"
                                className="mb-1"
                                defaultValue={openModal === "newPermission" ? "" : permission?.descricao}
                                ref={inputNamePermissionRef}
                                onChange={(e) => {
                                    console.log(e)
                                    let text = e.target.value.toUpperCase();   // MAIÚSCULO
                                    text = text.replace(/\s+/g, "_");          // ESPAÇO → UNDERSCORE
                                    text = text.replace(/[^A-Z0-9_]/g, "");    // REMOVE CARACTERES ESPECIAIS
                                    inputNamePermissionRef.current.value = text; // ATUALIZA O VALOR DO INPUT
                                }}
                            />

                            <span className="text-xs text-gray-500">
                                Este nome será utilizado como referência dentro do sistema.
                                Use letras maiúsculas, underscores e siga o padrão das permissões já existentes.
                            </span>
                        </CardHeader>

                        <CardContent>
                            {openModal === "newPermission" ? (
                                <Button
                                    className="mt-4 w-full"
                                    onClick={handleNewPermissions}
                                    isLoading={loadingButton === "salvar"}
                                    disabled={loadingButton === "salvar"}
                                >
                                    Cadastrar
                                </Button>
                            ) : (
                                <Button
                                    className="mt-4 w-full"
                                    onClick={handleAlterPermissions}
                                    isLoading={loadingButton === "alterar"}
                                    disabled={loadingButton === "alterar"}
                                >
                                    Alterar
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>
        </div >


    );
}
