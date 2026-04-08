export class ApiResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  version: string;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    error?: string,
    version: string = '1.0.0'
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.version = version;
  }

  static success<T>(data: T, message: string = 'Operação realizada com sucesso'): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data);
  }

  static error(message: string, error?: string): ApiResponseDto {
    return new ApiResponseDto(false, message, undefined, error);
  }
}

export class PaginatedResponseDto<T = any> extends ApiResponseDto<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message: string = 'Dados paginados retornados com sucesso'
  ) {
    super(true, message, data);
    this.pagination = pagination;
  }
} 