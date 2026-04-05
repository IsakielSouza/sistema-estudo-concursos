import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string | undefined;
            name: string | undefined;
            avatar_url: string | undefined;
        };
    }>;
    loginWithGoogle(body: {
        token: string;
    }): Promise<{
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
    getProfile(req: any): any;
    logout(req: any): Promise<{
        message: string;
    }>;
}
