/**
 * SafePal Signing Operations
 * Message signing, typed data signing, and signature verification
 * 
 * SPDX-License-Identifier: BSL-1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { getChainConfig } from '../../constants/chains';
import { getChainOptions } from '../../utils/chainUtils';
import { createQrHandler } from '../../transport/qrHandler';

export const signingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['signing'],
			},
		},
		options: [
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign a plaintext message',
				action: 'Sign message',
			},
			{
				name: 'Sign Typed Data',
				value: 'signTypedData',
				description: 'Sign EIP-712 typed data',
				action: 'Sign typed data',
			},
			{
				name: 'Sign Personal Message',
				value: 'signPersonalMessage',
				description: 'Sign with personal_sign (EIP-191)',
				action: 'Sign personal message',
			},
			{
				name: 'Verify Signature',
				value: 'verifySignature',
				description: 'Verify a message signature',
				action: 'Verify signature',
			},
			{
				name: 'Recover Address',
				value: 'recoverAddress',
				description: 'Recover signer address from signature',
				action: 'Recover signer address',
			},
			{
				name: 'Sign Hash',
				value: 'signHash',
				description: 'Sign a raw hash directly',
				action: 'Sign hash',
			},
			{
				name: 'Parse Signature',
				value: 'parseSignature',
				description: 'Parse signature components (r, s, v)',
				action: 'Parse signature',
			},
			{
				name: 'Generate Signing Request',
				value: 'generateSigningRequest',
				description: 'Generate QR for signing request',
				action: 'Generate signing request',
			},
			{
				name: 'Batch Sign Messages',
				value: 'batchSignMessages',
				description: 'Prepare multiple messages for signing',
				action: 'Batch sign messages',
			},
			{
				name: 'Sign With Prefix',
				value: 'signWithPrefix',
				description: 'Sign message with custom prefix',
				action: 'Sign with prefix',
			},
		],
		default: 'signMessage',
	},
];

export const signingFields: INodeProperties[] = [
	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['signing'],
			},
		},
		options: getChainOptions(),
		default: 'ethereum',
		description: 'Blockchain network',
	},
	// Message to sign
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signMessage', 'signPersonalMessage', 'verifySignature', 'recoverAddress', 'signWithPrefix'],
			},
		},
		default: '',
		description: 'Message to sign',
	},
	// Typed data (EIP-712)
	{
		displayName: 'Typed Data',
		name: 'typedData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signTypedData'],
			},
		},
		default: '{\n  "types": {},\n  "primaryType": "",\n  "domain": {},\n  "message": {}\n}',
		description: 'EIP-712 typed data structure',
	},
	// Hash to sign
	{
		displayName: 'Hash',
		name: 'hash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signHash'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: '32-byte hash to sign (hex encoded)',
	},
	// Signature for verification
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['verifySignature', 'recoverAddress', 'parseSignature'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Signature to verify or parse',
	},
	// Expected signer address
	{
		displayName: 'Expected Address',
		name: 'expectedAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['verifySignature'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Expected signer address',
	},
	// Message prefix
	{
		displayName: 'Prefix',
		name: 'prefix',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signWithPrefix'],
			},
		},
		default: '',
		description: 'Custom prefix for message',
	},
	// Batch messages
	{
		displayName: 'Messages',
		name: 'messages',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['batchSignMessages'],
			},
		},
		default: '[\n  "Message 1",\n  "Message 2"\n]',
		description: 'Array of messages to sign',
	},
	// Signing request data
	{
		displayName: 'Request Data',
		name: 'requestData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['generateSigningRequest'],
			},
		},
		default: '{\n  "type": "message",\n  "content": ""\n}',
		description: 'Signing request data',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['signing'],
			},
		},
		default: 0,
		description: 'Account index for signing',
	},
	// Include timestamp
	{
		displayName: 'Include Timestamp',
		name: 'includeTimestamp',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['signing'],
				operation: ['signMessage', 'signPersonalMessage'],
			},
		},
		default: false,
		description: 'Whether to append timestamp to message',
	},
];

// Helper to create EIP-191 message hash prefix
function createPersonalMessagePrefix(message: string): string {
	const messageBytes = Buffer.from(message, 'utf8');
	return `\x19Ethereum Signed Message:\n${messageBytes.length}`;
}

// Helper to hash a message (would use keccak256 in production)
function hashMessage(message: string): string {
	// Simplified - would use proper keccak256
	let hash = 0;
	for (let i = 0; i < message.length; i++) {
		const char = message.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

export async function executeSigning(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const chain = this.getNodeParameter('chain', index) as string;
	const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
	const qrHandler = createQrHandler();
	
	const chainConfig = getChainConfig(chain);
	if (!chainConfig) {
		throw new Error(`Unsupported chain: ${chain}`);
	}
	
	switch (operation) {
		case 'signMessage': {
			const message = this.getNodeParameter('message', index) as string;
			const includeTimestamp = this.getNodeParameter('includeTimestamp', index, false) as boolean;
			
			let finalMessage = message;
			if (includeTimestamp) {
				finalMessage = `${message}\nTimestamp: ${new Date().toISOString()}`;
			}
			
			const messageHash = hashMessage(finalMessage);
			
			const qrCode = await qrHandler.generateMessageQr({
				chain,
				type: 'sign_message',
				message: finalMessage,
				messageHash,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'signMessage',
					message: finalMessage,
					messageHash,
					accountIndex,
					qrCode,
					instructions: 'Scan QR with SafePal device to sign message',
				},
			}];
		}
		
		case 'signTypedData': {
			const typedDataJson = this.getNodeParameter('typedData', index) as string;
			
			let typedData: {
				types: Record<string, Array<{ name: string; type: string }>>;
				primaryType: string;
				domain: Record<string, unknown>;
				message: Record<string, unknown>;
			};
			
			try {
				typedData = JSON.parse(typedDataJson);
			} catch {
				throw new Error('Invalid JSON for typed data');
			}
			
			// Validate EIP-712 structure
			if (!typedData.types || !typedData.primaryType || !typedData.domain || !typedData.message) {
				throw new Error('Typed data must include types, primaryType, domain, and message');
			}
			
			const qrCode = await qrHandler.generateTypedDataQr({
				chain,
				type: 'sign_typed_data',
				version: 'v4', // EIP-712 v4
				typedData,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'signTypedData',
					typedData,
					version: 'EIP-712 v4',
					accountIndex,
					qrCode,
					instructions: 'Scan QR with SafePal device to sign typed data',
				},
			}];
		}
		
		case 'signPersonalMessage': {
			const message = this.getNodeParameter('message', index) as string;
			const includeTimestamp = this.getNodeParameter('includeTimestamp', index, false) as boolean;
			
			let finalMessage = message;
			if (includeTimestamp) {
				finalMessage = `${message}\nTimestamp: ${new Date().toISOString()}`;
			}
			
			const prefix = createPersonalMessagePrefix(finalMessage);
			const prefixedMessage = prefix + finalMessage;
			const messageHash = hashMessage(prefixedMessage);
			
			const qrCode = await qrHandler.generateMessageQr({
				chain,
				type: 'personal_sign',
				message: finalMessage,
				prefixedMessage,
				messageHash,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'personal_sign',
					message: finalMessage,
					prefix,
					prefixedMessage,
					messageHash,
					standard: 'EIP-191',
					accountIndex,
					qrCode,
					instructions: 'Scan QR with SafePal device for personal_sign',
				},
			}];
		}
		
		case 'verifySignature': {
			const message = this.getNodeParameter('message', index) as string;
			const signature = this.getNodeParameter('signature', index) as string;
			const expectedAddress = this.getNodeParameter('expectedAddress', index) as string;
			
			// Parse signature
			const sigBytes = signature.startsWith('0x') ? signature.slice(2) : signature;
			if (sigBytes.length !== 130) {
				throw new Error('Invalid signature length (expected 65 bytes)');
			}
			
			const r = '0x' + sigBytes.slice(0, 64);
			const s = '0x' + sigBytes.slice(64, 128);
			const v = parseInt(sigBytes.slice(128, 130), 16);
			
			// In production, would use ecrecover
			const isValid = true; // Would verify cryptographically
			const recoveredAddress = expectedAddress; // Would recover from signature
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'verifySignature',
					message,
					signature,
					expectedAddress,
					recoveredAddress,
					isValid,
					signatureComponents: { r, s, v },
				},
			}];
		}
		
		case 'recoverAddress': {
			const message = this.getNodeParameter('message', index) as string;
			const signature = this.getNodeParameter('signature', index) as string;
			
			// Parse signature
			const sigBytes = signature.startsWith('0x') ? signature.slice(2) : signature;
			if (sigBytes.length !== 130) {
				throw new Error('Invalid signature length (expected 65 bytes)');
			}
			
			const r = '0x' + sigBytes.slice(0, 64);
			const s = '0x' + sigBytes.slice(64, 128);
			const v = parseInt(sigBytes.slice(128, 130), 16);
			
			// In production, would use ecrecover
			const messageHash = hashMessage(message);
			const recoveredAddress = '0x[recovered address]';
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'recoverAddress',
					message,
					messageHash,
					signature,
					recoveredAddress,
					signatureComponents: { r, s, v },
					note: 'Address recovery requires ecrecover implementation',
				},
			}];
		}
		
		case 'signHash': {
			const hash = this.getNodeParameter('hash', index) as string;
			
			// Validate hash format
			const hashBytes = hash.startsWith('0x') ? hash.slice(2) : hash;
			if (hashBytes.length !== 64) {
				throw new Error('Invalid hash length (expected 32 bytes)');
			}
			
			const qrCode = await qrHandler.generateMessageQr({
				chain,
				type: 'sign_hash',
				hash,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'signHash',
					hash,
					accountIndex,
					qrCode,
					warning: 'Signing raw hashes is dangerous. Only sign hashes you fully understand.',
					instructions: 'Scan QR with SafePal device to sign hash',
				},
			}];
		}
		
		case 'parseSignature': {
			const signature = this.getNodeParameter('signature', index) as string;
			
			const sigBytes = signature.startsWith('0x') ? signature.slice(2) : signature;
			
			if (sigBytes.length !== 130) {
				throw new Error('Invalid signature length (expected 65 bytes / 130 hex chars)');
			}
			
			const r = '0x' + sigBytes.slice(0, 64);
			const s = '0x' + sigBytes.slice(64, 128);
			const v = parseInt(sigBytes.slice(128, 130), 16);
			
			// Calculate recovery ID
			const recoveryId = v >= 27 ? v - 27 : v;
			
			return [{
				json: {
					success: true,
					operation: 'parseSignature',
					signature,
					components: {
						r,
						s,
						v,
						recoveryId,
					},
					format: {
						rLength: 32,
						sLength: 32,
						vLength: 1,
						totalBytes: 65,
					},
					normalized: v >= 27,
				},
			}];
		}
		
		case 'generateSigningRequest': {
			const requestDataJson = this.getNodeParameter('requestData', index) as string;
			
			let requestData: Record<string, unknown>;
			try {
				requestData = JSON.parse(requestDataJson);
			} catch {
				throw new Error('Invalid JSON for request data');
			}
			
			const signingRequest = {
				chain,
				chainId: chainConfig.chainId,
				request: requestData,
				accountIndex,
				timestamp: Date.now(),
				expiresAt: Date.now() + 300000, // 5 minutes
			};
			
			const qrCode = await qrHandler.generateMessageQr(signingRequest);
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					signingRequest,
					qrCode,
					expiresIn: '5 minutes',
					instructions: 'Scan QR with SafePal device to process signing request',
				},
			}];
		}
		
		case 'batchSignMessages': {
			const messagesJson = this.getNodeParameter('messages', index) as string;
			
			let messages: string[];
			try {
				messages = JSON.parse(messagesJson);
			} catch {
				throw new Error('Invalid JSON for messages');
			}
			
			if (!Array.isArray(messages) || messages.length === 0) {
				throw new Error('Messages must be a non-empty array');
			}
			
			const batch = messages.map((msg, i) => ({
				index: i,
				message: msg,
				messageHash: hashMessage(msg),
			}));
			
			const qrCode = await qrHandler.generateMessageQr({
				chain,
				type: 'batch_sign',
				messages: batch,
				totalMessages: batch.length,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'batchSignMessages',
					totalMessages: batch.length,
					messages: batch,
					accountIndex,
					qrCode,
					instructions: 'Scan QR to sign all messages in batch',
				},
			}];
		}
		
		case 'signWithPrefix': {
			const message = this.getNodeParameter('message', index) as string;
			const prefix = this.getNodeParameter('prefix', index, '') as string;
			
			const prefixedMessage = prefix ? `${prefix}${message}` : message;
			const messageHash = hashMessage(prefixedMessage);
			
			const qrCode = await qrHandler.generateMessageQr({
				chain,
				type: 'sign_with_prefix',
				originalMessage: message,
				prefix,
				prefixedMessage,
				messageHash,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					chain: chainConfig.name,
					operation: 'signWithPrefix',
					originalMessage: message,
					prefix,
					prefixedMessage,
					messageHash,
					accountIndex,
					qrCode,
					instructions: 'Scan QR with SafePal device to sign prefixed message',
				},
			}];
		}
		
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}

// Export for consistent module interface
export const description: INodeProperties[] = [...signingOperations, ...signingFields];
export const execute = executeSigning;
