import { usePermissionStore } from "../store/permissionStore";

export const usePermission = () => {
    const can = usePermissionStore((s) => s.hasPermission);
    const loading = usePermissionStore((s) => s.loading);

    return { can, loading };
};
