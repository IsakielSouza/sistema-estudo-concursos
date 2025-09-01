import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
export interface Material {
    id: string;
    title: string;
    description?: string;
    file_url: string;
    category: string;
    tags?: string;
    author?: string;
    exam_type?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
}
export declare class MaterialsService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    create(createMaterialDto: CreateMaterialDto, userId: string): Promise<Material>;
    findAll(): Promise<Material[]>;
    findOne(id: string): Promise<Material>;
    findByCategory(category: string): Promise<Material[]>;
    findByExamType(examType: string): Promise<Material[]>;
    search(query: string): Promise<Material[]>;
    update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<Material>;
    remove(id: string): Promise<void>;
}
