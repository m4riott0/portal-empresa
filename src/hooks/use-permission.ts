import { usePermissionStore } from "../store/permissionStore";

export const usePermission = () => {
    const can = usePermissionStore((s) => s.hasPermission);
    const loading = usePermissionStore((s) => s.loading);
    const permissions = usePermissionStore((s) => s.permissions)

    return { can, loading, permissions };
};
