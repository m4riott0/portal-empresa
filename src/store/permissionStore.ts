import { create } from "zustand";
import { Permission, ALL_PERMISSIONS } from "../_enuns/Permission";
import { useProfile } from "@/hooks/use-profile";
import { useProfileStore } from "./profileStore";
import api from "@/services/api";
// import { PermissionService } from "../services/permissionService";

type PermissionState = {
    permissions: Permission[];
    loading: boolean;
    error: string | null;

    loadPermissions: () => Promise<void>;
    hasPermission: (perm: Permission) => boolean;
};

export const usePermissionStore = create<PermissionState>((set, get) => ({
    permissions: [],
    loading: false,
    error: null,

    loadPermissions: async () => {
        try {
            set({ loading: true, error: null });

            const profileState = useProfileStore.getState();
            const id = profileState.getProfileId();

            if (!id) {
                throw new Error("Usuário sem perfil");
            }

            const response = await api.get(
                `/Permissao/ListarPermissoesVinculadas?CdTipoPerfil=${id}&page=1&pageSize=0&SnAtivo=true`
            );

            const permissions:[] = response.data.data.map(
                (item: any) => item.ds_permissao
            );

            // Verifica todas as permissões do perfil rebecida está no enum
            const todosExistem = permissions.every(item => ALL_PERMISSIONS.includes(item))

            if (!todosExistem) {
                throw new Error("Permissões não encontrada");
            }

            set({ permissions: permissions });         
        } 
        finally {
            set({ loading: false });
        }
    },

    hasPermission: (perm: Permission) => {
        return get().permissions.includes(perm);
    },
}));
