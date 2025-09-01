import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService implements OnModuleInit {
    private configService;
    private supabase;
    private supabaseAdmin;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    getClient(): SupabaseClient;
    getAdminClient(): SupabaseClient;
    getAuthUser(token: string): Promise<import("@supabase/supabase-js").AuthUser | null>;
    signUp(email: string, password: string): Promise<{
        user: import("@supabase/supabase-js").AuthUser | null;
        session: import("@supabase/supabase-js").AuthSession | null;
    }>;
    signIn(email: string, password: string): Promise<{
        user: import("@supabase/supabase-js").AuthUser;
        session: import("@supabase/supabase-js").AuthSession;
        weakPassword?: import("@supabase/supabase-js").WeakPassword;
    }>;
    signOut(token: string): Promise<void>;
}
