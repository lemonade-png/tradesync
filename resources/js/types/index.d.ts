export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    preferred_currency?: string;
    timezone?: string;
    theme?: 'dark' | 'light' | 'system';
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
};

declare global {
    interface Window {
        axios: import('axios').AxiosInstance;
    }
}

declare module '@ybouane/liquidglass' {
    export interface LiquidGlassConfig {
        cornerRadius?: number;
        blurAmount?: number;
        refraction?: number;
        chromAberration?: number;
        opacity?: number;
        saturation?: number;
        tintStrength?: number;
        brightness?: number;
        shadowOpacity?: number;
        floating?: boolean;
        button?: boolean;
        bevelMode?: 0 | 1;
    }

    export interface LiquidGlassInitOptions {
        root: HTMLElement | null;
        glassElements?: NodeListOf<Element> | HTMLElement[];
        defaults?: LiquidGlassConfig;
    }

    export class LiquidGlass {
        static init(options: LiquidGlassInitOptions): Promise<LiquidGlass>;
        markChanged(element?: HTMLElement): void;
        destroy(): void;
    }
}