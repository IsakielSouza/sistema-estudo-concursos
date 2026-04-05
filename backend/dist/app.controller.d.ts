import { AppService } from './app.service';
import { ApiResponseDto } from './common/dto/api-response.dto';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): ApiResponseDto;
    healthCheck(mobileInfo: any): ApiResponseDto;
    getApiInfo(): ApiResponseDto;
}
