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
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = class SupabaseService {
    configService;
    supabase;
    supabaseAdmin;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseAnonKey = this.configService.get('SUPABASE_ANON_KEY');
        const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration is missing');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
        if (supabaseServiceKey) {
            this.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        }
        else {
            this.supabaseAdmin = this.supabase;
        }
    }
    getClient() {
        return this.supabase;
    }
    getAdminClient() {
        return this.supabaseAdmin;
    }
    async getAuthUser(token) {
        const { data: { user }, error } = await this.supabase.auth.getUser(token);
        if (error)
            throw error;
        return user;
    }
    async signUp(email, password) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
        });
        if (error)
            throw error;
        return data;
    }
    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error)
            throw error;
        return data;
    }
    async signOut(token) {
        const { error } = await this.supabase.auth.signOut();
        if (error)
            throw error;
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map