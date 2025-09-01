export declare class ApiResponseDto<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
    version: string;
    constructor(success: boolean, message: string, data?: T, error?: string, version?: string);
    static success<T>(data: T, message?: string): ApiResponseDto<T>;
    static error(message: string, error?: string): ApiResponseDto;
}
export declare class PaginatedResponseDto<T = any> extends ApiResponseDto<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    constructor(data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, message?: string);
}
