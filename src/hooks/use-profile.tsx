import { useProfileStore } from "../store/profileStore";

export const useProfile = () => {
    const profile = useProfileStore((s) => s.profile);
    const is = useProfileStore((s) => s.isProfile);
    const getId = useProfileStore((s) => s.getProfileId);
    const loading = useProfileStore((s) => s.loading);

    return { profile, is, getId, loading };
};
