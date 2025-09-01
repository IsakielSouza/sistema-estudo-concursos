export interface MobileInfo {
    deviceId?: string;
    appVersion?: string;
    platform?: 'android' | 'ios' | 'web';
    userAgent?: string;
    isMobile: boolean;
}
export declare const MobileInfo: (...dataOrPipes: unknown[]) => ParameterDecorator;
