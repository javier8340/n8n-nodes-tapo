import {
    INodeType,
    INodeTypeDescription,
    ITriggerFunctions,
    ITriggerResponse,
} from 'n8n-workflow';
import { cloudLogin, loginDevice, loginDeviceByIp } from 'tp-link-tapo-connect';
import TapoData, { TapoDevice } from './plug/TapoData';

export class TapoTrigger implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Tapo Trigger',
        name: 'tapoTrigger',
        icon: 'file:resources/tapo.svg',
        group: ['trigger'],
        version: 1,
        description: 'Triggers when a Tapo device changes its state',
        defaults: { name: 'Tapo Trigger' },
        credentials: [
            {
                name: 'TapoAccount',
                required: true,
            },
        ],
        triggerPanel: true,
        inputs: [],
        outputs: ['main'],
        properties: [
            ...TapoData.defaultParameters
        ],
    };

    async trigger(this: ITriggerFunctions): Promise<ITriggerResponse | undefined> {
        const credentials = (await this.getCredentials('TapoAccount')) as {
            email: string;
            password: string;
        };
        
        const interval = this.getNodeParameter('interval') as number;
        const mode = this.getNodeParameter('mode') as string;
        let device: TapoDevice;
        if (mode === 'cloud') {
            const cloud = await cloudLogin(credentials.email, credentials.password);
            const deviceId = this.getNodeParameter('deviceId') as string;
            const devList = await cloud.listDevices();
            const selected = devList.find((d: any) => d.deviceId === deviceId);
            if (!selected) throw new Error('Device not found in the cloud');
            device = await loginDevice(credentials.email, credentials.password, selected);
        } else {
            const ip = this.getNodeParameter('deviceIp') as string;
            device = await loginDeviceByIp(credentials.email, credentials.password, ip);
        };

        let lastState: boolean | undefined;

        const poll = async (): Promise<void> => {
            try {
                const info = await device.getDeviceInfo();
                if (lastState === undefined) {
                    lastState = info.device_on;
                } else if (lastState !== info.device_on) {
                    lastState = info.device_on;

                    this.emit([this.helpers.returnJsonArray([
                        {
                            event: 'stateChanged',
                            state: info.device_on,
                            timestamp: new Date().toISOString(),
                        },
                    ])]);
                }
            } catch (error) {
                this.logger.error('Tapo Trigger Error', { error });
            }
        };

        const intervalId = setInterval(poll, interval * 1000);

        return {
            closeFunction: async () => {
                clearInterval(intervalId);
            },
        };
    }
}
