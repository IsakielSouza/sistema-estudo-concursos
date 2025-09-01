"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const google_auth_library_1 = require("google-auth-library");
const supabase_service_1 = require("../common/supabase/supabase.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    supabaseService;
    usersService;
    jwtService;
    googleClient;
    constructor(supabaseService, usersService, jwtService) {
        this.supabaseService = supabaseService;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }
    async login(loginDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginDto.email,
            password: loginDto.password,
        });
        if (error || !data.user) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const user = await this.usersService.findByEmail(loginDto.email);
        const payload = {
            sub: data.user.id,
            email: data.user.email,
            name: user?.name
        };
        const accessToken = this.jwtService.sign(payload);
        return {
            access_token: accessToken,
            user: {
                id: data.user.id,
                email: data.user.email,
                name: user?.name,
                avatar_url: user?.avatar_url,
            },
        };
    }
    async loginWithGoogle(googleToken) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: googleToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new common_1.UnauthorizedException('Token do Google inválido');
            }
            const { email, name, picture, sub: googleId } = payload;
            if (!email) {
                throw new common_1.UnauthorizedException('Email não encontrado no token do Google');
            }
            console.log(`Processando login Google para email: ${email}`);
            let user = await this.usersService.findByEmail(email);
            if (!user) {
                console.log('Usuário não encontrado na tabela users, tentando criar...');
                try {
                    const supabaseAdmin = this.supabaseService.getAdminClient();
                    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                        email,
                        email_confirm: true,
                        user_metadata: {
                            name: name || 'Usuário Google',
                            google_id: googleId,
                            avatar_url: picture,
                        },
                    });
                    if (authError) {
                        console.log('Falha ao criar usuário no auth, tentando buscar existente...');
                        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                        if (listError) {
                            console.error('Erro ao listar usuários:', listError);
                            throw new common_1.UnauthorizedException('Erro ao verificar usuários existentes');
                        }
                        const existingUser = existingUsers.users.find(u => u.email === email);
                        if (existingUser) {
                            console.log('Usuário encontrado no auth, usando upsert para criar/atualizar perfil...');
                            user = await this.usersService.createProfileOnly({
                                id: existingUser.id,
                                email,
                                name: name || existingUser.user_metadata?.name || 'Usuário Google',
                                avatar_url: picture,
                                google_id: googleId,
                            });
                        }
                        else {
                            throw new common_1.UnauthorizedException('Não foi possível criar ou encontrar usuário');
                        }
                    }
                    else {
                        console.log('Usuário criado no auth, criando perfil na tabela users...');
                        user = await this.usersService.createProfileOnly({
                            id: authData.user.id,
                            email,
                            name: name || 'Usuário Google',
                            avatar_url: picture,
                            google_id: googleId,
                        });
                    }
                }
                catch (error) {
                    console.error('Erro ao processar usuário:', error);
                    throw new common_1.UnauthorizedException('Erro ao processar usuário Google');
                }
            }
            else {
                console.log('Usuário encontrado na tabela users, atualizando informações...');
                if (user.google_id !== googleId || user.avatar_url !== picture) {
                    user = await this.usersService.update(user.id, {
                        google_id: googleId,
                        avatar_url: picture,
                        name: name || user.name,
                    });
                }
            }
            if (!user) {
                throw new common_1.UnauthorizedException('Erro ao processar usuário Google');
            }
            console.log(`Usuário processado com sucesso: ${user.id}`);
            const jwtPayload = {
                sub: user.id,
                email: user.email,
                name: user.name
            };
            const accessToken = this.jwtService.sign(jwtPayload);
            return {
                access_token: accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar_url: user.avatar_url,
                    google_id: user.google_id,
                },
            };
        }
        catch (error) {
            console.error('Erro no login com Google:', error);
            throw new common_1.UnauthorizedException('Erro na autenticação com Google');
        }
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.UnauthorizedException('Usuário já existe');
        }
        const user = await this.usersService.create(registerDto);
        return this.login({
            email: registerDto.email,
            password: registerDto.password,
        });
    }
    async validateUser(userId) {
        const user = await this.usersService.findOne(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map