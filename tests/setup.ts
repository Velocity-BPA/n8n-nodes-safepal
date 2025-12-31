// Jest setup file

// Increase test timeout for complex operations
jest.setTimeout(30000);

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
	// Filter out expected errors during testing
	const message = args[0]?.toString() || '';
	if (message.includes('Expected error') || message.includes('Test error')) {
		return;
	}
	originalConsoleError.apply(console, args);
};

// Global test utilities
global.testUtils = {
	mockAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD4f',
	mockContractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
	mockTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
	mockPrivateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

// Declare global type
declare global {
	var testUtils: {
		mockAddress: string;
		mockContractAddress: string;
		mockTxHash: string;
		mockPrivateKey: string;
	};
}

export {};
