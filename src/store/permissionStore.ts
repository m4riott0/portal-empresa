import { create } from "zustand";
import { Permission, ALL_PERMISSIONS } from "../_enuns/Permission";
import { useProfile } from "@/hooks/use-profile";
import { useProfileStore } from "./profileStore";
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
                set({ loading: false, error: 'Usuário sem perfil'  });
                return;
            }

            //TODO Terminar de desenvolver para após integrar com a API
            // const apiPermissions = await PermissionService.getByProfile(profile);
            // const response = await fetch(`/api/permissoes?perfil=${profile}`);

            // if (!response.ok) {
            //     throw new Error("Erro ao buscar permissões do perfil");
            // }
            const dataTeste = [
                {"status":true, "permission": "LISTAR_PERMISSOES"},
                {"status":false, "permission": "EDITAR_USUARIO"},
                {"status":true, "permission": "DELETAR_USUARIO"},
            ]

            const dataTesteFilter = dataTeste.filter(item => item.status).map(item => item.permission);

            // Filtra apenas permissões válidas do enum
            // const validPerms = apiPermissions.filter((p) =>
            const validPerms = dataTesteFilter.filter((p) =>
                ALL_PERMISSIONS.includes(p as Permission)
            ) as Permission[];

            set({ permissions: validPerms });
        } catch (err: any) {
            set({ error: err.message ?? "Erro inesperado" });
        } finally {
            set({ loading: false });
        }
    },
    hasPermission: (perm: Permission) => {
        return get().permissions.includes(perm);
    },
}));
