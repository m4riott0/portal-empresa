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

import { ArrowUpDown, Briefcase, Search, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

// TODO paginacao na lista

interface payloadConnectPermissions {
    id_permissao: number;
    id_perfil: number;
    vincular: boolean;
}


export default function PermissaoPerfil() {

    const [openModal, setOpenModal] = useState(false)
    const [idPerfil, setIdPerfil] = useState(null)
    const [Message, setMessage] = useState("")
    const [payload, setPayload] = useState<payloadConnectPermissions>({ id_perfil: 0, id_permissao: 0, vincular: false })

    // Permission.LISTAR_PERMISSOES

    const tipoPerfil = [
        { id: '0', nome: 'Administrador - TI' },
        { id: '1', nome: 'Comercial' },
        { id: '5', nome: 'Cadastro' },
        { id: '2', nome: 'Administrador - Cliente Bensaude' },
        { id: '3', nome: 'Comum - Cliente Bensaude' },
        { id: '4', nome: 'Pre-cadastro - Cliente Bensaude' },
    ];

    const [data, setData] = useState([
        { id: '0', status: true, nome: 'Cadastrar Beneficiario' },
        { id: '1', status: false, nome: 'Relatorio Beneficiario' },
        { id: '5', status: true, nome: 'Excluir Beneficiario' },
        { id: '2', status: false, nome: 'Gerar Contrato' },
        { id: '3', status: true, nome: 'Gerar Pre-cadastro' },
        { id: '4', status: false, nome: 'Relatorio financeiro' },
    ]);

    const [dataFilter, setDataFilter] = useState(data);

    const handleCompanyChange = (perfilId: string) => {
        setIdPerfil(perfilId)
    };

    const handleCheckboxChange = (id: string, value: boolean | "indeterminate") => {
        const checked = !!value
        const perfil = tipoPerfil.find(item => item.id === idPerfil)
        const permission = data.find(item => item.id === id)

        setPayload({
            id_perfil: parseInt(perfil.id),
            id_permissao: parseInt(id),
            vincular: checked
        })

        setMessage(`A permissão <b>${permission.nome}</b> será <b>${checked ? 'vinculada</b> ao' : 'desvinculada</b> do'} perfil ${perfil.nome}`)//TODO verificar se a mensagem é entendivel
        setOpenModal(true)
    }

    const handleChange = (e) => {

        setDataFilter(data.filter(permission => { return permission.nome.toLowerCase().includes(e.target.value.toLowerCase()) }))

        console.log(e.target.value)
    }

    const handleConnectPermissions = useCallback(async () => {
        try {

            // const response = await fetch("https://api.example.com/save", {
            // method: "POST",
            // headers: { "Content-Type": "application/json" },
            // body: JSON.stringify(payload)
            // });

            // const data = await response.json();
            // console.log("Resposta:", data);

        } catch (error) {
            console.error("Erro ao enviar:", error);
        } finally {

            // Atualiza o checkbox na grid
            setData(prev =>
                prev.map(item =>
                    parseInt(item.id) === payload.id_permissao
                        ? { ...item, status: !item.status } // Inverte o status para atualizar na grid 
                        : item
                )
            );

        }
    }, [payload]);

    return (
        <div className="space-y-8">

            {/* CARD DO SELECT */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-6 w-6 text-primary" />
                        <CardTitle>Permissão de tipos de perfil</CardTitle>
                    </div>
                    <CardDescription>
                        Vincular permissões aos tipos de perfil.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Select onValueChange={handleCompanyChange}>
                        <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                            <SelectValue placeholder="Selecione um tipo de perfil..." />
                        </SelectTrigger>

                        <SelectContent>
                            {tipoPerfil.map(perfil => (
                                <SelectItem key={perfil.id} value={perfil.id}>
                                    {perfil.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* CARD DA TABELA */}
            <Card>
                <CardContent className="space-y-6 pt-5">
                    {
                        idPerfil === null ?
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
                                        !!dataFilter.length ? (
                                            <div className="border rounded-md my-5 ">
                                                <Table className="w-full">
                                                    {/* <TableHeader>...</TableHeader> */}
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
                                                        {/* Ponto de melhoria: use dataFilter aqui */}
                                                        {dataFilter.map((permissao) => (
                                                            <TableRow key={permissao.id} className="hover:bg-muted/50">
                                                                <TableCell className="text-muted-foreground">{permissao.nome}</TableCell>
                                                                <TableCell className="text-muted-foreground text-center !pr-4">
                                                                    <Checkbox
                                                                        checked={permissao.status}
                                                                        onCheckedChange={(v) => handleCheckboxChange(permissao.id, v)}
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
            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogDescription className="pt-2 text-lg text-black break-normal">
                            <p dangerouslySetInnerHTML={{ __html: Message }} />
                        </DialogDescription>
                    </DialogHeader>
                    <Button className="mt-4" onClick={handleConnectPermissions}>Continuar</Button>
                </DialogContent>
            </Dialog>

        </div>


    );
}
