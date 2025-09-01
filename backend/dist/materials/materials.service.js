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
exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../common/supabase/supabase.service");
let MaterialsService = class MaterialsService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(createMaterialDto, userId) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('materials')
            .insert({
            ...createMaterialDto,
            created_by: userId,
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Erro ao criar material: ${error.message}`);
        }
        return data;
    }
    async findAll() {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Erro ao buscar materiais: ${error.message}`);
        }
        return data || [];
    }
    async findOne(id) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException(`Material com ID ${id} não encontrado`);
        }
        return data;
    }
    async findByCategory(category) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Erro ao buscar materiais por categoria: ${error.message}`);
        }
        return data || [];
    }
    async findByExamType(examType) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .eq('exam_type', examType)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Erro ao buscar materiais por tipo de concurso: ${error.message}`);
        }
        return data || [];
    }
    async search(query) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.ilike.%${query}%`)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Erro ao buscar materiais: ${error.message}`);
        }
        return data || [];
    }
    async update(id, updateMaterialDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('materials')
            .update({
            ...updateMaterialDto,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException(`Material com ID ${id} não encontrado`);
        }
        return data;
    }
    async remove(id) {
        const supabase = this.supabaseService.getClient();
        const { error } = await supabase
            .from('materials')
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Erro ao deletar material: ${error.message}`);
        }
    }
};
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], MaterialsService);
//# sourceMappingURL=materials.service.js.map