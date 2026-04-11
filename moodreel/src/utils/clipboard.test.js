import { encodeSharePayload, decodeSharePayload } from './clipboard';

describe('share payload encoding helpers', () => {
    it('round-trips ascii payloads', () => {
        const payload = { list: ['one', 'two'], count: 2 };
        const encoded = encodeSharePayload(payload);
        const decoded = decodeSharePayload(encoded);

        expect(decoded).toEqual(payload);
        expect(typeof encoded).toBe('string');
        expect(encoded.length).toBeGreaterThan(0);
    });

    it('round-trips unicode payloads', () => {
        const payload = { title: 'Café 🎬', accents: ['niño', 'français'] };
        const encoded = encodeSharePayload(payload);
        const decoded = decodeSharePayload(encoded);

        expect(decoded).toEqual(payload);
    });
});

