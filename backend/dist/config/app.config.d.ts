declare const _default: (() => {
    port: number;
    environment: string;
    version: string;
    mobile: {
        allowedOrigins: string[];
        allowedHeaders: string[];
        rateLimit: {
            windowMs: number;
            max: number;
            message: string;
        };
    };
    security: {
        jwtSecret: string | undefined;
        jwtExpiresIn: string;
        bcryptRounds: number;
    };
    supabase: {
        url: string | undefined;
        anonKey: string | undefined;
        serviceRoleKey: string | undefined;
    };
    upload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
        storagePath: string;
    };
    cache: {
        ttl: number;
        max: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    environment: string;
    version: string;
    mobile: {
        allowedOrigins: string[];
        allowedHeaders: string[];
        rateLimit: {
            windowMs: number;
            max: number;
            message: string;
        };
    };
    security: {
        jwtSecret: string | undefined;
        jwtExpiresIn: string;
        bcryptRounds: number;
    };
    supabase: {
        url: string | undefined;
        anonKey: string | undefined;
        serviceRoleKey: string | undefined;
    };
    upload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
        storagePath: string;
    };
    cache: {
        ttl: number;
        max: number;
    };
}>;
export default _default;
