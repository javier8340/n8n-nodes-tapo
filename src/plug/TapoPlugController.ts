import { TapoDeviceInfo } from "tp-link-tapo-connect";


type TapoPlugControllerTypes = {
    email: string;
    password: string;
    mode?: string;
    deviceIp?: string;
    deviceId?: string;
    action?: string;
}

class  TapoPlugController{
    email: string;
    password: string;
    mode: string;
    deviceIp: string;
    deviceId: string;
    action: string;

    constructor(params: TapoPlugControllerTypes) {
        this.email = params.email;
        this.password = params.password;
        this.mode = params.mode || 'local';
        this.deviceIp = params.deviceIp || '';
        this.deviceId = params.deviceId || '';
        this.action = params.action || 'on';
    }

}

export type TapoDevice = {
    turnOn: (deviceId?: string) => Promise<void>;
    turnOff: (deviceId?: string) => Promise<void>;
    setBrightness: (brightnessLevel?: number) => Promise<void>;
    setColour: (colour?: string) => Promise<void>;
    setHSL: (hue: number, sat: number, lum: number) => Promise<void>;
    getDeviceInfo: () => Promise<TapoDeviceInfo>;
    getChildDevicesInfo: () => Promise<TapoDeviceInfo[]>;
    getEnergyUsage: () => Promise<TapoDeviceInfo>;
}
export default TapoPlugController;