"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let MobileLoggingInterceptor = class MobileLoggingInterceptor {
    logger = new common_1.Logger('MobileAPI');
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, headers } = request;
        const deviceId = headers['x-device-id'];
        const appVersion = headers['x-app-version'];
        const userAgent = headers['user-agent'];
        const isMobileRequest = deviceId || userAgent?.includes('Mobile') || userAgent?.includes('Android') || userAgent?.includes('iPhone');
        if (isMobileRequest) {
            this.logger.log(`📱 Mobile Request: ${method} ${url} | Device: ${deviceId || 'Unknown'} | App Version: ${appVersion || 'Unknown'}`);
        }
        const now = Date.now();
        return next.handle().pipe((0, operators_1.tap)(() => {
            const responseTime = Date.now() - now;
            if (isMobileRequest) {
                this.logger.log(`📱 Mobile Response: ${method} ${url} | Time: ${responseTime}ms | Device: ${deviceId || 'Unknown'}`);
            }
        }));
    }
};
exports.MobileLoggingInterceptor = MobileLoggingInterceptor;
exports.MobileLoggingInterceptor = MobileLoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], MobileLoggingInterceptor);
//# sourceMappingURL=mobile-logging.interceptor.js.map