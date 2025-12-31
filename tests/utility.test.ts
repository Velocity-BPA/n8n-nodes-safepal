import { execute, description } from '../nodes/SafePal/actions/utility';

// Mock n8n types
const mockExecuteFunctions = {
	getNodeParameter: jest.fn(),
	getInputData: jest.fn(() => [{ json: {} }]),
	helpers: {
		returnJsonArray: jest.fn((data) => [{ json: data }]),
	},
	getNode: jest.fn(() => ({ name: 'SafePal', type: 'n8n-nodes-safepal.safePal' })),
	continueOnFail: jest.fn(() => false),
};

// Helper to create parameter mock with default value support
function createParamMock(params: Record<string, unknown>) {
	return (name: string, _index: number, defaultValue?: unknown) => {
		if (params.hasOwnProperty(name)) {
			return params[name];
		}
		return defaultValue;
	};
}

describe('Utility Operations', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('description', () => {
		it('should export description array', () => {
			expect(Array.isArray(description)).toBe(true);
			expect(description.length).toBeGreaterThan(0);
		});

		it('should have operations defined', () => {
			const operationsField = description.find(
				(field) => field.name === 'operation' && field.displayOptions?.show?.resource?.includes('utility')
			);
			expect(operationsField).toBeDefined();
			expect(operationsField?.options).toBeDefined();
		});
	});

	describe('encodeHex', () => {
		it('should encode string to hex', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: 'Hello' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'encodeHex');

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.hex).toBeDefined();
		});

		it('should detect already hex input', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: '0x48656c6c6f' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'encodeHex');

			expect(result[0].json.type).toBe('already_hex');
		});
	});

	describe('decodeHex', () => {
		it('should decode hex to string', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: '48656c6c6f' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'decodeHex');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.decoded).toBe('Hello');
		});

		it('should handle 0x prefix', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: '0x48656c6c6f' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'decodeHex');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.decoded).toBe('Hello');
		});
	});

	describe('encodeBase64', () => {
		it('should encode string to base64', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: 'Hello World', urlSafe: false })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'encodeBase64');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.base64).toBe('SGVsbG8gV29ybGQ=');
		});

		it('should encode URL-safe base64', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: 'Hello World', urlSafe: true })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'encodeBase64');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.base64).toBeDefined();
		});
	});

	describe('decodeBase64', () => {
		it('should decode base64 to string', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: 'SGVsbG8gV29ybGQ=' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'decodeBase64');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.decoded).toBe('Hello World');
		});
	});

	describe('hashData', () => {
		it('should hash data with SHA256', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: 'test', algorithm: 'sha256' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'hashData');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.hash).toBeDefined();
			expect(result[0].json.algorithm).toBe('sha256');
		});

		it('should hash data with MD5', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: 'test', algorithm: 'md5' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'hashData');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.algorithm).toBe('md5');
		});
	});

	describe('convertUnits', () => {
		it('should convert ether to wei', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ value: '1', fromUnit: 'ether', toUnit: 'wei' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'convertUnits');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.converted).toBe('1000000000000000000');
		});

		it('should convert wei to gwei', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ value: '1000000000', fromUnit: 'wei', toUnit: 'gwei' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'convertUnits');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.converted).toBe('1');
		});

		it('should convert gwei to ether', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ value: '1000000000', fromUnit: 'gwei', toUnit: 'ether' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'convertUnits');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.converted).toBe('1');
		});
	});

	describe('formatAddress', () => {
		it('should format address to lowercase', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					chain: 'ethereum',
					address: '0x742D35Cc6634C0532925a3b844Bc9e7595F2BD4F',
					formatType: 'lowercase',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'formatAddress');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.formatted).toBe('0x742d35cc6634c0532925a3b844bc9e7595f2bd4f');
		});

		it('should format address to uppercase', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					chain: 'ethereum',
					address: '0x742d35cc6634c0532925a3b844bc9e7595f2bd4f',
					formatType: 'uppercase',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'formatAddress');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.formatted).toBe('0X742D35CC6634C0532925A3B844BC9E7595F2BD4F');
		});

		it('should format address to shortened', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					chain: 'ethereum',
					address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD4f',
					formatType: 'shortened',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'formatAddress');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.formatted).toContain('...');
		});
	});

	describe('parseAmount', () => {
		it('should parse ETH amount to wei', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ value: '1.5', decimals: 18, chain: 'ethereum' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'parseAmount');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.parsed).toBeDefined();
		});

		it('should parse plain number with default decimals', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ value: '1', decimals: 18, chain: 'ethereum' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'parseAmount');

			expect(result[0].json.success).toBe(true);
		});
	});

	describe('formatAmount', () => {
		it('should format wei to ETH', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ value: '1000000000000000000', decimals: 18, chain: 'ethereum' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'formatAmount');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.formatted).toBe('1');
		});
	});

	describe('generateRandom', () => {
		it('should generate random bytes', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ randomType: 'bytes', byteLength: 32 })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'generateRandom');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.hex).toBeDefined();
		});

		it('should generate random number in range', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ randomType: 'number', min: 1, max: 100 })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'generateRandom');

			expect(result[0].json.success).toBe(true);
			expect(typeof result[0].json.value).toBe('number');
			expect(result[0].json.value).toBeGreaterThanOrEqual(1);
			expect(result[0].json.value).toBeLessThanOrEqual(100);
		});

		it('should generate UUID', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ randomType: 'uuid' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'generateRandom');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
		});
	});

	describe('padHex', () => {
		it('should pad hex left', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: '1234', padSide: 'left', targetLength: 8 })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'padHex');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.padded).toBe('0x00001234');
		});

		it('should pad hex right', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: '1234', padSide: 'right', targetLength: 8 })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'padHex');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.padded).toBe('0x12340000');
		});
	});

	describe('calculateGasCost', () => {
		it('should calculate gas cost', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					chain: 'ethereum',
					gasLimit: 21000,
					gasPrice: 50,
					includePriorityFee: false,
					nativeSymbol: 'ETH',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'calculateGasCost');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.costWei).toBeDefined();
		});

		it('should calculate EIP-1559 gas cost', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					chain: 'ethereum',
					gasLimit: 21000,
					gasPrice: 30,
					includePriorityFee: true,
					priorityFee: 2,
					nativeSymbol: 'ETH',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'calculateGasCost');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.priorityFee).toBeDefined();
		});
	});

	describe('encodeBase58', () => {
		it('should encode to base58', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: '48656c6c6f' })
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'encodeBase58');

			expect(result[0].json.success).toBe(true);
			expect(typeof result[0].json.base58).toBe('string');
		});
	});

	describe('decodeBase58', () => {
		it('should decode from base58', async () => {
			// First encode, then decode
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: '48656c6c6f' })
			);

			const encodeResult = await execute.call(mockExecuteFunctions as any, 0, 'encodeBase58');
			const encoded = encodeResult[0].json.base58 as string;

			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({ input: encoded })
			);

			const decodeResult = await execute.call(mockExecuteFunctions as any, 0, 'decodeBase58');

			expect(decodeResult[0].json.success).toBe(true);
			expect(decodeResult[0].json.hex).toBe('0x48656c6c6f');
		});
	});
});
