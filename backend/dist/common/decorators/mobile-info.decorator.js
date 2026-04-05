"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileInfo = void 0;
const common_1 = require("@nestjs/common");
exports.MobileInfo = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;
    const userAgent = headers['user-agent'] || '';
    const deviceId = headers['x-device-id'];
    const appVersion = headers['x-app-version'];
    let platform = 'web';
    if (userAgent.includes('Android')) {
        platform = 'android';
    }
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        platform = 'ios';
    }
    const isMobile = platform !== 'web' || !!deviceId;
    return {
        deviceId,
        appVersion,
        platform,
        userAgent,
        isMobile,
    };
});
//# sourceMappingURL=mobile-info.decorator.js.map