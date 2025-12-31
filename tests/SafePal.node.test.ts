import { SafePal } from '../nodes/SafePal/SafePal.node';

describe('SafePal Node', () => {
	let node: SafePal;

	beforeEach(() => {
		node = new SafePal();
	});

	describe('node definition', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('SafePal');
		});

		it('should have correct node name', () => {
			expect(node.description.name).toBe('safePal');
		});

		it('should have correct icon', () => {
			expect(node.description.icon).toBe('file:safepal.svg');
		});

		it('should have correct group', () => {
			expect(node.description.group).toContain('transform');
		});

		it('should have version 1', () => {
			expect(node.description.version).toBe(1);
		});

		it('should have inputs and outputs', () => {
			expect(node.description.inputs).toBeDefined();
			expect(node.description.outputs).toBeDefined();
		});
	});

	describe('credentials', () => {
		it('should require credentials', () => {
			expect(node.description.credentials).toBeDefined();
			expect(Array.isArray(node.description.credentials)).toBe(true);
		});

		it('should include device credentials', () => {
			const credNames = node.description.credentials?.map((c) => c.name) || [];
			expect(credNames).toContain('safePalDeviceCredentials');
		});

		it('should include network credentials', () => {
			const credNames = node.description.credentials?.map((c) => c.name) || [];
			expect(credNames).toContain('safePalNetworkCredentials');
		});

		it('should include app credentials', () => {
			const credNames = node.description.credentials?.map((c) => c.name) || [];
			expect(credNames).toContain('safePalAppCredentials');
		});
	});

	describe('resources', () => {
		it('should have resource property', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			expect(resourceProp).toBeDefined();
			expect(resourceProp?.type).toBe('options');
		});

		it('should have all 25 resources', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			expect(options?.length).toBe(25);
		});

		it('should include device resource', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];
			expect(values).toContain('device');
		});

		it('should include account resource', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];
			expect(values).toContain('account');
		});

		it('should include blockchain resources', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];

			expect(values).toContain('bitcoin');
			expect(values).toContain('ethereum');
			expect(values).toContain('solana');
			expect(values).toContain('cosmos');
			expect(values).toContain('tron');
			expect(values).toContain('polkadot');
			expect(values).toContain('near');
			expect(values).toContain('aptos');
			expect(values).toContain('sui');
			expect(values).toContain('xrp');
			expect(values).toContain('cardano');
			expect(values).toContain('evmChains');
			expect(values).toContain('multiChain');
		});

		it('should include token and transaction resources', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];

			expect(values).toContain('token');
			expect(values).toContain('transaction');
		});

		it('should include signing resource', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];
			expect(values).toContain('signing');
		});

		it('should include dapp and walletConnect resources', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];

			expect(values).toContain('dapp');
			expect(values).toContain('walletConnect');
		});

		it('should include security and utility resources', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];

			expect(values).toContain('security');
			expect(values).toContain('utility');
		});

		it('should include qrCode and bluetooth resources', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];

			expect(values).toContain('qrCode');
			expect(values).toContain('bluetooth');
		});

		it('should include safePalApp resource', () => {
			const resourceProp = node.description.properties?.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options?.map((o) => o.value) || [];
			expect(values).toContain('safePalApp');
		});
	});

	describe('execute method', () => {
		it('should have execute method', () => {
			expect(typeof node.execute).toBe('function');
		});
	});
});
