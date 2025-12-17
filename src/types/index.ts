

export interface Usuario {
    cd_conta: number,
    nm_usuario: string,
    nm_operador: string,
    cd_tipo_perfil: number,
    ds_tipo_perfil: string,
    cd_plano: number,
    ds_empresa: string,
    cd_empresa_mv: number,
    ds_email: string
    sn_ativo: "S" | "N",
    sn_troca_senha: "S" | "N"
}

export interface Empresa {
    cd_empresa: number,
    ds_razao_social: string,
    nm_fantasia: string,
    nr_cnpj: string,
    sn_ativo: string,
    cd_plano: number,
    cd_empresa_mv: number,
    cd_empresa_pai: number
}
