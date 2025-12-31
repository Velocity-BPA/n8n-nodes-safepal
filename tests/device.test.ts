import { execute, description } from '../nodes/SafePal/actions/device';

// Mock n8n types
const mockExecuteFunctions = {
	getNodeParameter: jest.fn(),
	getInputData: jest.fn(() => [{ json: {} }]),
	helpers: {
		returnJsonArray: jest.fn((data) => [{ json: data }]),
	},
	getNode: jest.fn(() => ({ name: 'SafePal', type: 'n8n-nodes-safepal.safePal' })),
	continueOnFail: jest.fn(() => false),
	getCredentials: jest.fn(() => ({
		deviceType: 's1',
		connectionMode: 'qr',
	})),
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

describe('Device Operations', () => {
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
				(field) => field.name === 'operation' && field.displayOptions?.show?.resource?.includes('device')
			);
			expect(operationsField).toBeDefined();
			expect(operationsField?.options).toBeDefined();
		});

		it('should include all required operations', () => {
			const operationsField = description.find(
				(field) => field.name === 'operation' && field.displayOptions?.show?.resource?.includes('device')
			);
			const options = operationsField?.options as Array<{ value: string }>;
			const operationValues = options?.map((opt) => opt.value) || [];

			expect(operationValues).toContain('getInfo');
			expect(operationValues).toContain('getCapabilities');
			expect(operationValues).toContain('listModels');
			expect(operationValues).toContain('verifyConnection');
		});
	});

	describe('getInfo', () => {
		it('should return device information', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					deviceModel: 's1',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'getInfo');

			expect(result).toHaveLength(1);
			expect(result[0].json.success).toBe(true);
			expect(result[0].json.device).toBeDefined();
		});

		it('should handle x1 model', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					deviceModel: 'x1',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'getInfo');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.device.id).toBe('x1');
		});
	});

	describe('listModels', () => {
		it('should return list of device models', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'listModels');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.models).toBeDefined();
			expect(Array.isArray(result[0].json.models)).toBe(true);
		});
	});

	describe('getCapabilities', () => {
		it('should return device capabilities', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					deviceModel: 's1',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'getCapabilities');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.capabilities).toBeDefined();
		});
	});

	describe('verifyConnection', () => {
		it('should verify connection status', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					connectionMethod: 'qr',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'verifyConnection');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.connectionMethod).toBe('qr');
		});
	});

	describe('checkCompatibility', () => {
		it('should check device compatibility', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({
					deviceModel: 's1',
					connectionMethod: 'qr',
					targetOperation: 'signing',
				})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'checkCompatibility');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.isCompatible).toBeDefined();
		});
	});

	describe('getFirmwareInfo', () => {
		it('should return firmware information', async () => {
			mockExecuteFunctions.getNodeParameter.mockImplementation(
				createParamMock({})
			);

			const result = await execute.call(mockExecuteFunctions as any, 0, 'getFirmwareInfo');

			expect(result[0].json.success).toBe(true);
			expect(result[0].json.firmware).toBeDefined();
		});
	});
});
