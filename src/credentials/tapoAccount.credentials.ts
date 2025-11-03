
import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TapoAccount implements ICredentialType {
    name = 'TapoAccount';
    displayName = 'Tapo';
    properties: INodeProperties[] = [
        {
            displayName: 'Email',
            name: 'email',
            type: 'string',
            default: '',
        },
        {
            displayName: 'Password',
            name: 'password',
            type: 'string',
            typeOptions: { password: true },
            default: '',
        },
    ];
}
