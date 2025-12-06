import { INodeProperties } from "n8n-workflow";
import { TapoDeviceInfo } from "tp-link-tapo-connect";


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

class TapoData {
    static defaultParameters: INodeProperties[] = [
        {
            displayName: 'Connection Mode',
            name: 'mode',
            type: 'options',
            options: [
                { name: 'Via local IP', value: 'local' },
                { name: 'From cloud (discovery)', value: 'cloud' },
            ],
            default: 'local',
        },
        {
            displayName: 'Device IP',
            name: 'deviceIp',
            type: 'string',
            default: '',
            displayOptions: { show: { mode: ['local'] } },
        },
        {
            displayName: 'Device (cloud only)',
            name: 'deviceId',
            type: 'string',
            displayOptions: { show: { mode: ['cloud'] } },
            default: '',
        }
    ];

}

export default TapoData;
