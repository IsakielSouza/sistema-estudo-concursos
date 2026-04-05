"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedResponseDto = exports.ApiResponseDto = void 0;
class ApiResponseDto {
    success;
    message;
    data;
    error;
    timestamp;
    version;
    constructor(success, message, data, error, version = '1.0.0') {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
        this.timestamp = new Date().toISOString();
        this.version = version;
    }
    static success(data, message = 'Operação realizada com sucesso') {
        return new ApiResponseDto(true, message, data);
    }
    static error(message, error) {
        return new ApiResponseDto(false, message, undefined, error);
    }
}
exports.ApiResponseDto = ApiResponseDto;
class PaginatedResponseDto extends ApiResponseDto {
    pagination;
    constructor(data, pagination, message = 'Dados paginados retornados com sucesso') {
        super(true, message, data);
        this.pagination = pagination;
    }
}
exports.PaginatedResponseDto = PaginatedResponseDto;
//# sourceMappingURL=api-response.dto.js.map