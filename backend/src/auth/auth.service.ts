import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { SupabaseService } from '../common/supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Buscar dados do usuário
    const user = await this.usersService.findByEmail(loginDto.email);
    
    // Gerar JWT token
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

  private async resolveGoogleTokenPayload(googleToken: string): Promise<{ email: string; name?: string; picture?: string; googleId: string }> {
    // Try as ID token first
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload?.email && payload?.sub) {
        return { email: payload.email, name: payload.name, picture: payload.picture, googleId: payload.sub };
      }
    } catch {
      // Not an ID token, try as access token
    }

    // Fall back to access token via userinfo endpoint
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${googleToken}` },
    });
    if (!res.ok) {
      throw new UnauthorizedException('Token do Google inválido');
    }
    const data = await res.json() as { email?: string; name?: string; picture?: string; sub?: string };
    if (!data.email || !data.sub) {
      throw new UnauthorizedException('Token do Google inválido');
    }
    return { email: data.email, name: data.name, picture: data.picture, googleId: data.sub };
  }

  async loginWithGoogle(googleToken: string) {
    try {
      const { email, name, picture, googleId } = await this.resolveGoogleTokenPayload(googleToken);

      if (!email) {
        throw new UnauthorizedException('Email não encontrado no token do Google');
      }

      console.log(`Processando login Google para email: ${email}`);

      // Primeiro, tentar buscar usuário existente na tabela users
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        console.log('Usuário não encontrado na tabela users, tentando criar...');
        
        // Usuário não existe na tabela users, mas pode existir no auth
        // Vamos tentar criar usando o service role
        try {
          const supabaseAdmin = this.supabaseService.getAdminClient();
          
          // Tentar criar usuário no auth do Supabase
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
            // Se falhar, pode ser que o usuário já exista no auth
            console.log('Falha ao criar usuário no auth, tentando buscar existente...');
            
            // Tentar buscar usuário existente no auth
            const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            
            if (listError) {
              console.error('Erro ao listar usuários:', listError);
              throw new UnauthorizedException('Erro ao verificar usuários existentes');
            }
            
            const existingUser = existingUsers.users.find(u => u.email === email);
            
            if (existingUser) {
              console.log('Usuário encontrado no auth, usando upsert para criar/atualizar perfil...');
              
              // Usar upsert para criar ou atualizar o perfil na tabela users
              // Isso evita conflitos de ID duplicado
              user = await this.usersService.createProfileOnly({
                id: existingUser.id,
                email,
                name: name || existingUser.user_metadata?.name || 'Usuário Google',
                avatar_url: picture,
                google_id: googleId,
              });
            } else {
              throw new UnauthorizedException('Não foi possível criar ou encontrar usuário');
            }
          } else {
            console.log('Usuário criado no auth, criando perfil na tabela users...');
            // Usuário criado com sucesso no auth, agora criar o perfil
            user = await this.usersService.createProfileOnly({
              id: authData.user.id,
              email,
              name: name || 'Usuário Google',
              avatar_url: picture,
              google_id: googleId,
            });
          }
        } catch (error) {
          console.error('Erro ao processar usuário:', error);
          throw new UnauthorizedException('Erro ao processar usuário Google');
        }
      } else {
        console.log('Usuário encontrado na tabela users, atualizando informações...');
        // Usuário já existe, atualizar informações do Google se necessário
        if (user.google_id !== googleId || user.avatar_url !== picture) {
          user = await this.usersService.update(user.id, {
            google_id: googleId,
            avatar_url: picture,
            name: name || user.name,
          });
        }
      }

      if (!user) {
        throw new UnauthorizedException('Erro ao processar usuário Google');
      }

      console.log(`Usuário processado com sucesso: ${user.id}`);

      // Gerar JWT token
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
    } catch (error) {
      console.error('Erro no login com Google:', error);
      throw new UnauthorizedException('Erro na autenticação com Google');
    }
  }

  async register(registerDto: RegisterDto) {
    // Verificar se usuário já existe
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('Usuário já existe');
    }

    // Criar usuário
    const user = await this.usersService.create(registerDto);

    // Fazer login automaticamente
    return this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }
} 