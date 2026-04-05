import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./users.service").User>;
    findAll(): Promise<import("./users.service").User[]>;
    findOne(id: string): Promise<import("./users.service").User>;
    getProfile(req: any): Promise<import("./users.service").User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("./users.service").User>;
    remove(id: string): Promise<void>;
}
