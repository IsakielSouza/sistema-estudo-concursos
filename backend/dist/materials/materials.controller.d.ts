import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    create(createMaterialDto: CreateMaterialDto, req: any): Promise<import("./materials.service").Material>;
    findAll(): Promise<import("./materials.service").Material[]>;
    search(query: string): Promise<import("./materials.service").Material[]>;
    findByCategory(category: string): Promise<import("./materials.service").Material[]>;
    findByExamType(examType: string): Promise<import("./materials.service").Material[]>;
    findOne(id: string): Promise<import("./materials.service").Material>;
    update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<import("./materials.service").Material>;
    remove(id: string): Promise<void>;
}
