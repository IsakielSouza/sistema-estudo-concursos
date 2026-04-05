import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    google_id?: string;
    created_at: string;
    updated_at: string;
}
export declare class UsersService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    create(createUserDto: CreateUserDto): Promise<User>;
    createProfileOnly(profileData: {
        id: string;
        email: string;
        name: string;
        avatar_url?: string;
        google_id?: string;
    }): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<void>;
}
