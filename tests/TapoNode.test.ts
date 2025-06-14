import { TapoNode } from '../src/TapoNode';
import type { INodeTypeDescription } from 'n8n-workflow';

describe('TapoNode', () => {
    it('should expose a valid description', () => {
        const node = new TapoNode();
        const desc: INodeTypeDescription = node.description;

        expect(desc.displayName).toBe('Tapo');
        expect(desc.name).toBe('tapo');
        expect(desc.properties).toBeInstanceOf(Array);
    });
});
