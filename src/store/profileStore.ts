import { create } from "zustand";
import { Profile, ALL_PROFILES } from "@/_enuns/Profile";

type UserProfile = {
    id: number;
    perfil: string;
};

type ProfileStore = {
    profile: UserProfile | null;
    loading: boolean;

    setProfile: (profile: UserProfile) => void;
    isProfile: (perfil: Profile | Profile[]) => boolean;
    getProfileId: () => number | null;
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
    profile: null,
    loading: true,

    setProfile: (profile) => {

        // Verificando se o perfil recebido é um dos perfils que está no enuns
        const isValidPerfil = ALL_PROFILES.includes(profile.perfil as Profile);

        if (!isValidPerfil) {
            set({ profile: null, loading: false });
            throw new Error("Perfil inválido: " + profile.perfil);
        }

        set({ profile, loading: false });
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
