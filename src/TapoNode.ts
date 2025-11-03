import {INodeType, INodeTypeDescription, IExecuteFunctions, NodeConnectionTypes} from 'n8n-workflow';
import {cloudLogin, loginDevice, loginDeviceByIp} from 'tp-link-tapo-connect';
import {TapoDevice} from "./plug/TapoPlugController";


export class TapoNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Tapo',
        name: 'tapo',
        group: ['output'],
        icon: 'file:resources/tapo.svg',
        version: 1,
        description: 'Controls TP-Link Tapo lights and plugs',
        defaults: {name: 'Tapo'},
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
                    {name: 'Via local IP', value: 'local'},
                    {name: 'From cloud (discovery)', value: 'cloud'},
                ],
                default: 'local',
            },
            {
                displayName: 'Device IP',
                name: 'deviceIp',
                type: 'string',
                default: '',
                displayOptions: {show: {mode: ['local']}},
            },
            {
                displayName: 'Device (cloud only)',
                name: 'deviceId',
                type: 'string',
                displayOptions: {show: {mode: ['cloud']}},
                default: '',
            },
            {
                displayName: 'Device Type',
                name: 'device',
                type: 'options',
                options: [
                    {name: 'P100, P105, P110, P115 smart plugs', value: 'plugs'},
                    {name: 'L510E, L530E smart bulbs', value: 'bulb'},
                    {name: 'L900-10 smart strip', value: 'strip'},
                ],
                default: 'on',
            },
            {
                displayName: 'Action',
                name: 'action',
                type: 'options',
                options: [
                    {name: 'Turn On', value: 'on'},
                    {name: 'Turn Off', value: 'off'},
                    {name: 'Toggle', value: 'toggle'},
                ],
                default: 'on',
            },
        ],
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
                    break;
                case 'off':
                    await device.turnOff();
                    break;
                case 'toggle':
                    await ((await (device.getDeviceInfo())).device_on ? device.turnOff() : device.turnOn());
                    break;
            }

            returnData.push({json: {status: 'ok', action}});
        }

        return [returnData];
    }
}
