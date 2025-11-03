import { INodeType, INodeTypeDescription, IExecuteFunctions, NodeConnectionTypes, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { cloudLogin, loginDevice, loginDeviceByIp, TapoDeviceInfo } from 'tp-link-tapo-connect';
import { TapoDevice } from "./plug/TapoPlugController";


export class TapoNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Tapo',
        name: 'tapo',
        group: ['output'],
        icon: 'file:resources/tapo.svg',
        version: 1,
        description: 'Controls TP-Link Tapo lights and plugs',
        defaults: { name: 'Tapo' },
        credentials: [
            {
                name: 'TapoAccount',
                required: true,
            },
        ],
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        properties: [
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
            },
            {
                displayName: 'Device Type',
                name: 'device',
                type: 'options',
                options: [
                    { name: 'P100, P105, P110, P115 smart plugs', value: 'plugs' },
                    { name: 'L510E, L530E smart bulbs', value: 'bulb' },
                    { name: 'L900-10 smart strip', value: 'strip' },
                ],
                default: 'plugs',
            },
            {
                displayName: 'Action',
                name: 'action',
                type: 'options',
                typeOptions: {
                    loadOptionsMethod: 'getActions',
                    loadOptionsDependsOn: ['device'],
                },
                default: 'setState',
            },
            {
                displayName: 'Brightness',
                name: 'brightness',
                type: 'number',
                typeOptions: {
                    minValue: 1,
                    maxValue: 100,
                },
                default: 50,
                displayOptions: {
                    show: {
                        action: ['setBrightness'],
                    },
                },
            },
            {
                displayName: 'Color (hex)',
                name: 'color',
                type: 'string',
                default: '#ffffff',
                displayOptions: {
                    show: {
                        action: ['setColor'],
                    },
                },
            },
            {
                displayName: 'Hue',
                name: 'hue',
                type: 'number',
                typeOptions: {
                    minValue: 0,
                    maxValue: 360,
                },
                default: 0,
                displayOptions: {
                    show: {
                        action: ['setHSL'],
                    },
                },
            },
            {
                displayName: 'Saturation',
                name: 'sat',
                type: 'number',
                typeOptions: {
                    minValue: 0,
                    maxValue: 100,
                },
                default: 100,
                displayOptions: {
                    show: {
                        action: ['setHSL'],
                    },
                },
            },
            {
                displayName: 'Luminosity',
                name: 'lum',
                type: 'number',
                typeOptions: {
                    minValue: 0,
                    maxValue: 100,
                },
                default: 50,
                displayOptions: {
                    show: {
                        action: ['setHSL'],
                    },
                },
            },
             {
                displayName: 'State',
                name: 'state',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        action: ['setState'],
                    },
                },
            },
        ],
    };

    methods = {
        loadOptions: {
            async getActions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const device = (this.getCurrentNodeParameter('device') as string) || 'plugs';
                const common: INodePropertyOptions[] = [
                    { name: 'Turn On', value: 'on' },
                    { name: 'Turn Off', value: 'off' },
                    { name: 'Set state', value: 'setState' },
                    { name: 'Toggle', value: 'toggle' },
                ];
                if (device === 'plugs') {
                    return [
                        ...common,
                        { name: 'Get Energy Usage', value: 'getEnergy' },
                    ];
                }
                return [
                    ...common,
                    { name: 'Set Brightness', value: 'setBrightness' },
                    { name: 'Set Color (hex)', value: 'setColor' },
                    { name: 'Set HSL', value: 'setHSL' },
                ];
            },
        }
    };

    async execute(this: IExecuteFunctions): Promise<any[][]> {
        const items = this.getInputData();
        const returnData: any[] = [];
        const credentials = (await this.getCredentials('tapoAccount')) as { email: string; password: string; };
        const email = credentials.email;
        const password = credentials.password;
        for (let i = 0; i < items.length; i++) {
            const mode = this.getNodeParameter('mode', i) as string;
            const action = this.getNodeParameter('action', i) as string;
            let device: TapoDevice;
            if (mode === 'cloud') {
                const cloud = await cloudLogin(email, password);
                const deviceId = this.getNodeParameter('deviceId', i) as string;
                const devList = await cloud.listDevicesByType('');
                const selected = devList.find((d: any) => d.deviceId === deviceId);
                if (!selected) throw new Error('Device not found in the cloud');
                device = await loginDevice(email, password, selected);
            } else {
                const ip = this.getNodeParameter('deviceIp', i) as string;
                device = await loginDeviceByIp(email, password, ip);
            };
            switch (action) {
                case 'on':
                    await device.turnOn();
                    returnData.push({ json: { status: 'ok', action: 'turnOn' } });
                    break;
                case 'off':
                    await device.turnOff();
                    returnData.push({ json: { status: 'ok', action: 'turnOff' } });
                    break;
                case 'setState':
                    const state = this.getNodeParameter('state', i) as boolean;
                    await (state ? device.turnOn() : device.turnOff());
                    returnData.push({ json: { status: 'ok', action: 'turn'+state?'On':'Off' } });
                    break;
                case 'toggle':
                    {
                        await ((await (device.getDeviceInfo())).device_on ? device.turnOff() : device.turnOn());
                        returnData.push({ json: { status: 'ok', action: 'toggle' } });
                    }
                    break;
                case 'setBrightness':
                    {
                        // solo válido para bulbs/strip; plugins pueden ignorarlo
                        const brightness = this.getNodeParameter('brightness', i) as number;
                        await device.setBrightness(brightness);
                        returnData.push({ json: { status: 'ok', action: 'setBrightness', brightness } });
                    }
                    break;
                case 'setColor':
                    {
                        const color = this.getNodeParameter('color', i) as string;
                        await device.setColour(color);
                        returnData.push({ json: { status: 'ok', action: 'setColor', color } });
                    }
                    break;
                case 'setHSL':
                    {
                        const hue = this.getNodeParameter('hue', i) as number;
                        const sat = this.getNodeParameter('sat', i) as number;
                        const lum = this.getNodeParameter('lum', i) as number;
                        await device.setHSL(hue, sat, lum);
                        returnData.push({ json: { status: 'ok', action: 'setHSL', hue, sat, lum } });
                    }
                    break;
                case 'getEnergy':
                    {
                        const usage = await device.getEnergyUsage();
                        returnData.push({ json: { status: 'ok', action: 'getEnergy', usage } });
                    }
                    break;
                default:
                    returnData.push({ json: { status: 'error', message: 'Unknown action' } })
            }
        }

        return [returnData];
    }
}
