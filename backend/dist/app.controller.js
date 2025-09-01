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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const api_response_dto_1 = require("./common/dto/api-response.dto");
const mobile_info_decorator_1 = require("./common/decorators/mobile-info.decorator");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return api_response_dto_1.ApiResponseDto.success({
            message: this.appService.getHello(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
        }, 'API funcionando corretamente');
    }
    healthCheck(mobileInfo) {
        return api_response_dto_1.ApiResponseDto.success({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            mobileInfo: mobileInfo.isMobile ? {
                platform: mobileInfo.platform,
                appVersion: mobileInfo.appVersion,
                deviceId: mobileInfo.deviceId,
            } : null,
        }, 'Sistema funcionando normalmente');
    }
    getApiInfo() {
        return api_response_dto_1.ApiResponseDto.success({
            name: 'Sistema de Estudo para Concursos Públicos',
            version: '1.0.0',
            description: 'API para sistema de estudo de concursos públicos com suporte a aplicações móveis',
            features: [
                'Autenticação JWT',
                'Gestão de usuários',
                'Materiais de estudo',
                'Videoaulas',
                'Simulados',
                'Suporte a aplicações móveis',
            ],
            endpoints: {
                auth: '/api/v1/auth',
                users: '/api/v1/users',
                materials: '/api/v1/materials',
                health: '/api/v1/health',
            },
            mobileSupport: {
                android: true,
                ios: true,
                web: true,
                cors: true,
            },
        }, 'Informações da API');
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", api_response_dto_1.ApiResponseDto)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, mobile_info_decorator_1.MobileInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", api_response_dto_1.ApiResponseDto)
], AppController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", api_response_dto_1.ApiResponseDto)
], AppController.prototype, "getApiInfo", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map