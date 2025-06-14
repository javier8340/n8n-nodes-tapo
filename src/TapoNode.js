import { cloudLogin, loginDevice, loginDeviceByIp } from 'tp-link-tapo-connect';
export class TapoNode {
    constructor() {
        this.description = {
            displayName: 'Tapo',
            name: 'tapo',
            group: ['output'],
            icon: 'file:resources/tapo.svg',
            version: 1,
            description: 'Controls TP-Link Tapo lights and plugs',
            defaults: { name: 'Tapo' },
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
            properties: [
                { displayName: 'Email', name: 'email', type: 'string', default: '' },
                { displayName: 'Password', name: 'password', type: 'string', default: '', typeOptions: { password: true } },
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
                { displayName: 'Device IP', name: 'deviceIp', type: 'string', default: '' },
                {
                    displayName: 'Device (cloud only)',
                    name: 'deviceId',
                    type: 'string',
                    displayOptions: { show: { mode: ['cloud'] } },
                    default: '',
                },
                {
                    displayName: 'Action',
                    name: 'action',
                    type: 'options',
                    options: [
                        { name: 'Turn On', value: 'on' },
                        { name: 'Turn Off', value: 'off' },
                        { name: 'Toggle', value: 'toggle' },
                    ],
                    default: 'on',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const email = this.getNodeParameter('email', i);
            const password = this.getNodeParameter('password', i);
            const mode = this.getNodeParameter('mode', i);
            const action = this.getNodeParameter('action', i);
            let device;
            if (mode === 'cloud') {
                const cloud = await cloudLogin(email, password);
                const deviceId = this.getNodeParameter('deviceId', i);
                const devList = await cloud.listDevicesByType('');
                const selected = devList.find((d) => d.deviceId === deviceId);
                if (!selected)
                    throw new Error('Device not found in the cloud');
                device = await loginDevice(email, password, selected);
            }
            else {
                const ip = this.getNodeParameter('deviceIp', i);
                device = await loginDeviceByIp(email, password, ip);
            }
            switch (action) {
                case 'on':
                    await device.turnOn();
                    break;
                case 'off':
                    await device.turnOff();
                    break;
                case 'toggle':
                    await (device.getDeviceInfo().device_on ? device.turnOff() : device.turnOn());
                    break;
            }
            returnData.push({ json: { status: 'ok', action } });
        }
        return [returnData];
    }
}
