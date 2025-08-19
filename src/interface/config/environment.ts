// src/config/environment.ts
export interface GameConfig {
    apiUrl: string;
    fallbackUrl: string;
    development: boolean;
}

export class Environment {
    private static instance: Environment;
    private config: GameConfig;

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): Environment {
        if (!Environment.instance) {
            Environment.instance = new Environment();
        }
        return Environment.instance;
    }

    private loadConfig(): GameConfig {
        // Try to load from window.gameConfig first (set by build process)
        if (typeof window !== 'undefined' && (window as any).gameConfig) {
            return (window as any).gameConfig;
        }

        // Fallback to environment detection
        const isDevelopment = this.isDevelopment();
        
        return {
            apiUrl: isDevelopment ? 'http://localhost:8000' : 'https://your-api-domain.com',
            fallbackUrl: 'https://your-website.com',
            development: isDevelopment
        };
    }

    private isDevelopment(): boolean {
        if (typeof window === 'undefined') return false;
        
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname.startsWith('192.168.') ||
               hostname.includes('local');
    }

    public getConfig(): GameConfig {
        return this.config;
    }

    public getApiUrl(): string {
        return this.config.apiUrl;
    }

    public getFallbackUrl(): string {
        return this.config.fallbackUrl;
    }

    public isDev(): boolean {
        return this.config.development;
    }
}