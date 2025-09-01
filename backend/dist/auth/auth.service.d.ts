import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../common/supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly supabaseService;
    private readonly usersService;
    private readonly jwtService;
    private readonly googleClient;
    constructor(supabaseService: SupabaseService, usersService: UsersService, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string | undefined;
            name: string | undefined;
            avatar_url: string | undefined;
        };
    }>;
    loginWithGoogle(googleToken: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            avatar_url: string | undefined;
            google_id: string | undefined;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string | undefined;
            name: string | undefined;
            avatar_url: string | undefined;
        };
    }>;
    validateUser(userId: string): Promise<import("../users/users.service").User>;
}
