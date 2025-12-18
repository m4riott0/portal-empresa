import { create } from "zustand";
import { Profile, ALL_PROFILES } from "@/_enuns/Profile";

type UserProfile = {
    id: number;
    perfil: string;
};

type ProfileStore = {
    profile: UserProfile | null;
    loading: boolean;

    setProfile: (profile: UserProfile) => boolean;
    isProfile: (perfil: Profile | Profile[]) => boolean;
    getProfileId: () => number | null;
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
    profile: null,
    loading: true,

    setProfile: (profile) => {
        const isValidPerfil = ALL_PROFILES.includes(profile.perfil as Profile);

        if (!isValidPerfil) {
            console.error("Perfil inválido:", profile.perfil);
            set({ profile: null, loading: false });
            return false;
        }

        set({ profile, loading: false });
        return true;
    },

    isProfile: (perfil) => {
        const current = get().profile?.perfil;
        if (!current) return false;

        if (Array.isArray(perfil)) {
            return perfil.includes(current as Profile);
        }

        return current === perfil;
    },

    getProfileId: () => {
        return get().profile?.id ?? null;
    },
}));
