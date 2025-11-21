

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "../assets/bensaude.png";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Lock, LucideIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import NotFound from "./NotFound";

type Step = "token" | "password" | "success";


interface LabelAndInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
}

const LabelAndInput = ({ id, label, ...props }: LabelAndInputProps) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">{label}</Label>
        <div className="relative">
            <Input id={id} className="input-medical text-base" {...props} />
        </div>
    </div>
);
export default function PasswordRecovery() {

    const [codigoEmpresa, setCodigoEmpresa] = useState("");
    const [usuario, setUsuario] = useState("");
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");

    const [senha, setSenha] = useState("");
    const [confirmSenha, setConfirmSenha] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<Step>("token");
    const [invalidToken, setInvalidToken] = useState(false);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const tokenUrl = queryParams.get("token");
    
    //TODO Aplicar o spiner

    useEffect(() => {
        async function verificarToken() {
            if (step === "token" && tokenUrl) {
                try {

                    const response = await api.post("/RecuperaSenha/VerificarToken", {
                        token: tokenUrl,
                    });

                    if (response.data?.isSuccess === false && response.data?.data.tokenValidado === false) {
                        setInvalidToken(true);
                        return;
                    }
                    setToken(tokenUrl);
                    setStep("password");
                } catch (e) {
                    setInvalidToken(true);
                }
            }
        }

        verificarToken();
    }, []);

    // Se o token for inválido, mostra a página NotFound
    if (invalidToken) {
        return <NotFound />;
    }


    // --- Requisição do código ---
    const handleRequestToken = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        try {

            const response = await api.post("/RecuperaSenha/AlteraSenha", {
                'codigoEmpresa': codigoEmpresa,
                'usuario': usuario,
                'email': email,
            })

            if (response.data?.isSuccess === true) {
                toast({
                    title: "Link de recuperação enviado",
                    description: `Link de recuperação enviado para seu email`,
                });
            }

        } catch (error: any) {
            console.log(error)
            toast({
                title: "Erro ao enviar código",
                description:
                    error?.response?.data?.message ?? "Erro ao enviar token. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Alteração da senha ---
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (senha !== confirmSenha) {
            toast({
                title: "Senhas não coincidem",
                description: "As senhas digitadas não são iguais.",
                variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);
        try {

            const response = await api.post("/RecuperaSenha/RedefinirSenha", {
                'token': token,
                'novaSenha': senha
            })

            if (response.data?.isSuccess) {
                setStep("success");
                toast({
                    title: "Senha alterada com sucesso",
                    description: "Sua senha foi alterada com sucesso!",
                });
            }
        } catch (error: any) {
            toast({
                title: "Erro ao alterar senha",
                description:
                    error?.response?.data?.message ?? "Erro ao alterar senha. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-section-hero p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center items-center mb-8">
                    <img src={Logo} className="h-12 w-auto mb-4" alt="Logo da Bensaúde" />
                </div>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-500 mb-2">
                        Recuperar Senha
                    </h1>
                    <p className="text-muted-foreground">Redefina sua senha de acesso</p>
                </div>

                <Card className="card-medical">

                    {/* STEP 1 - Gerar Token */}
                    {step === "token" && (
                        <>
                            <CardHeader className="text-center">
                                <CardTitle>Preencha os campos para receber o link de recuperar senha</CardTitle>
                                <CardDescription>
                                    Enviaremos um link para seu e-mail cadastrado
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleRequestToken} className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex flex-col gap-2">
                                            <LabelAndInput
                                                id="companyCode"
                                                label="Código da Empresa"
                                                type="text"
                                                placeholder="Digite o código"
                                                value={codigoEmpresa}
                                                onChange={(e) => setCodigoEmpresa(e.target.value)}
                                                required
                                            />
                                            <LabelAndInput
                                                id="username"
                                                label="Usuário"
                                                type="text"
                                                placeholder="Usuario"
                                                value={usuario}
                                                onChange={(e) => setUsuario(e.target.value)}
                                                required
                                            />
                                            <LabelAndInput
                                                id="email"
                                                label="Email"
                                                type="email"
                                                placeholder="Digite o email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && (
                                            <LoadingSpinner size="sm" className="mr-2 border-white border-t-transparent" />
                                        )}
                                        Enviar Link
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {/* STEP 2 - Alterar senha */}
                    {step === "password" && (
                        <>
                            <CardHeader className="text-center">
                                <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
                                <CardTitle>Defina uma nova senha</CardTitle>
                                <CardDescription>
                                    Digite e confirme sua nova senha de acesso.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div className="space-y-2">
                                        <LabelAndInput
                                            id="senha"
                                            label="Nova senha"
                                            type="password"
                                            placeholder="Digite sua nova senha"
                                            value={senha}
                                            onChange={(e) => setSenha(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <LabelAndInput
                                            id="confirmSenha"
                                            label="Confirme a senha"
                                            type="password"
                                            placeholder="Digite sua nova senha"
                                            value={confirmSenha}
                                            onChange={(e) => setConfirmSenha(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                    // disabled={isSubmitting}
                                    >
                                        {/* {isSubmitting && (
                                            <LoadingSpinner size="sm" className="mr-2" />
                                        )} */}
                                        Alterar Senha
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {/* STEP 3 - Sucesso */}
                    {step === "success" && (
                        <>
                            <CardHeader className="text-center">
                                <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                                <CardTitle className="text-blue-500">Senha Alterada!</CardTitle>
                                <CardDescription>
                                    Sua senha foi alterada com sucesso. Agora você pode fazer
                                    login.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link to="/login">
                                    <Button className="w-full">
                                        Fazer Login
                                    </Button>
                                </Link>
                            </CardContent>
                        </>
                    )}

                    {/* Link de voltar */}
                    {step === "token" && (
                        <>
                            <CardContent className="pt-0">
                                <div className="text-center">
                                    <Link
                                        to="/login"
                                        className="text-sm text-primary hover:text-primary-hover transition-colors"
                                    >
                                        Voltar para o login
                                    </Link>
                                </div>
                            </CardContent>
                        </>
                    )}

                </Card>
            </div>
        </div>
    );
}