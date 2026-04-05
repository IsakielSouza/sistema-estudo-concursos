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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../common/supabase/supabase.service");
let UsersService = class UsersService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(createUserDto) {
        const supabase = this.supabaseService.getClient();
        const supabaseAdmin = this.supabaseService.getAdminClient();
        let userId;
        if (createUserDto.password) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(createUserDto.email)) {
                throw new Error('Formato de email inválido');
            }
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: createUserDto.email,
                password: createUserDto.password,
            });
            if (authError) {
                throw new Error(`Erro ao criar usuário: ${authError.message}`);
            }
            userId = authData.user?.id;
        }
        else {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: createUserDto.email,
                email_confirm: true,
                user_metadata: {
                    name: createUserDto.name,
                    google_id: createUserDto.google_id,
                    avatar_url: createUserDto.avatar_url,
                },
            });
            if (authError) {
                throw new Error(`Erro ao criar usuário Google: ${authError.message}`);
            }
            userId = authData.user?.id;
        }
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
            id: userId,
            email: createUserDto.email,
            name: createUserDto.name,
            avatar_url: createUserDto.avatar_url,
            google_id: createUserDto.google_id,
        })
            .select()
            .single();
        if (profileError) {
            throw new Error(`Erro ao criar perfil: ${profileError.message}`);
        }
        return profileData;
    }
    async createProfileOnly(profileData) {
        const supabaseAdmin = this.supabaseService.getAdminClient();
        const { data, error } = await supabaseAdmin
            .from('users')
            .upsert({
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            avatar_url: profileData.avatar_url,
            google_id: profileData.google_id,
        }, {
            onConflict: 'id',
            ignoreDuplicates: false
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Erro ao criar/atualizar perfil: ${error.message}`);
        }
        return data;
    }
    async findAll() {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Erro ao buscar usuários: ${error.message}`);
        }
        return data || [];
    }
    async findOne(id) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException(`Usuário com ID ${id} não encontrado`);
        }
        return data;
    }
    async findByEmail(email) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error) {
            return null;
        }
        return data;
    }
    async update(id, updateUserDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .update({
            ...updateUserDto,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException(`Usuário com ID ${id} não encontrado`);
        }
        return data;
    }
    async remove(id) {
        const supabase = this.supabaseService.getClient();
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Erro ao deletar usuário: ${error.message}`);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map