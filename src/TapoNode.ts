import {INodeType, INodeTypeDescription, IExecuteFunctions, NodeConnectionType} from 'n8n-workflow';
import { cloudLogin, loginDevice, loginDeviceByIp } from 'tp-link-tapo-connect';

export class TapoNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Tapo',
        name: 'tapo',
        group: ['output'],
        version: 1,
        description: 'Controla luces y enchufes TP-Link Tapo',
        defaults: { name: 'Tapo' },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        properties: [
            { displayName: 'Email', name: 'email', type: 'string', default: '' },
            { displayName: 'Password', name: 'password', type: 'string', default: '', typeOptions: { password: true } },
            {
                displayName: 'Modo conexión',
                name: 'mode',
                type: 'options',
                options: [
                    { name: 'Por IP local', value: 'local' },
                    { name: 'Desde nube (descubrimiento)', value: 'cloud' },
                ],
                default: 'local',
            },
            { displayName: 'IP del dispositivo', name: 'deviceIp', type: 'string', default: '' },
            {
                displayName: 'Dispositivo (solo nube)',
                name: 'deviceId',
                type: 'string',
                displayOptions: { show: { mode: ['cloud'] } },
                default: '',
            },
            {
                displayName: 'Acción',
                name: 'action',
                type: 'options',
                options: [
                    { name: 'Encender', value: 'on' },
                    { name: 'Apagar', value: 'off' },
                    { name: 'Toggle', value: 'toggle' },
                ],
                default: 'on',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<any[][]> {
        const items = this.getInputData();
        const returnData: any[] = [];

        for (let i = 0; i < items.length; i++) {
            const email = this.getNodeParameter('email', i) as string;
            const password = this.getNodeParameter('password', i) as string;
            const mode = this.getNodeParameter('mode', i) as string;
            const action = this.getNodeParameter('action', i) as string;
            let device: any;

            if (mode === 'cloud') {
                const cloud = await cloudLogin(email, password);
                const deviceId = this.getNodeParameter('deviceId', i) as string;
                const devList = await cloud.listDevicesByType('');
                const selected = devList.find((d: any) => d.deviceId === deviceId);
                if (!selected) throw new Error('Dispositivo no encontrado en la nube');
                device = await loginDevice(email, password, selected);
            } else {
                const ip = this.getNodeParameter('deviceIp', i) as string;
                device = await loginDeviceByIp(email, password, ip);
            }

            switch(action) {
                case 'on':
                    await device.turnOn();
                    break;
                case 'off':
                    await device.turnOff();
                    break;
                case 'toggle':
                    const info = await device.getDeviceInfo();
                    await (info.device_on ? device.turnOff() : device.turnOn());
                    break;
            }

            returnData.push({ json: { status: 'ok', action } });
        }

        return [returnData];
    }
}
