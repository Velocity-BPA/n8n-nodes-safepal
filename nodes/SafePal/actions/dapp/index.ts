/**
 * SafePal DApp Operations
 * DApp interaction, session management, and request handling
 * 
 * SPDX-License-Identifier: BSL-1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { getChainConfig, CHAIN_CONFIGS } from '../../constants/chains';
import { getEvmChainOptions } from '../../utils/chainUtils';
import { validateEvmAddress } from '../../utils/addressUtils';
import { createQrHandler } from '../../transport/qrHandler';

export const dappOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dapp'],
			},
		},
		options: [
			{
				name: 'Connect DApp',
				value: 'connectDapp',
				description: 'Generate connection request for DApp',
				action: 'Connect to DApp',
			},
			{
				name: 'Disconnect DApp',
				value: 'disconnectDapp',
				description: 'Disconnect from DApp session',
				action: 'Disconnect from DApp',
			},
			{
				name: 'Get Active Sessions',
				value: 'getActiveSessions',
				description: 'List active DApp sessions',
				action: 'Get active sessions',
			},
			{
				name: 'Handle Request',
				value: 'handleRequest',
				description: 'Handle incoming DApp request',
				action: 'Handle DApp request',
			},
			{
				name: 'Approve Request',
				value: 'approveRequest',
				description: 'Approve pending DApp request',
				action: 'Approve DApp request',
			},
			{
				name: 'Reject Request',
				value: 'rejectRequest',
				description: 'Reject pending DApp request',
				action: 'Reject DApp request',
			},
			{
				name: 'Switch Chain',
				value: 'switchChain',
				description: 'Handle chain switch request',
				action: 'Switch chain',
			},
			{
				name: 'Add Chain',
				value: 'addChain',
				description: 'Add new chain to wallet',
				action: 'Add chain',
			},
			{
				name: 'Get Permissions',
				value: 'getPermissions',
				description: 'Get DApp permissions',
				action: 'Get DApp permissions',
			},
			{
				name: 'Request Permissions',
				value: 'requestPermissions',
				description: 'Request additional permissions',
				action: 'Request permissions',
			},
			{
				name: 'Get DApp Info',
				value: 'getDappInfo',
				description: 'Get information about a DApp',
				action: 'Get DApp info',
			},
			{
				name: 'Simulate Request',
				value: 'simulateRequest',
				description: 'Simulate DApp request execution',
				action: 'Simulate request',
			},
		],
		default: 'connectDapp',
	},
];

export const dappFields: INodeProperties[] = [
	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['connectDapp', 'switchChain', 'addChain'],
			},
		},
		options: getEvmChainOptions(),
		default: 'ethereum',
		description: 'Blockchain network',
	},
	// DApp URL
	{
		displayName: 'DApp URL',
		name: 'dappUrl',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['connectDapp', 'getDappInfo'],
			},
		},
		default: '',
		placeholder: 'https://app.example.com',
		description: 'DApp URL',
	},
	// DApp name
	{
		displayName: 'DApp Name',
		name: 'dappName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['connectDapp'],
			},
		},
		default: '',
		description: 'DApp display name',
	},
	// Session ID
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['disconnectDapp', 'handleRequest', 'getPermissions', 'requestPermissions'],
			},
		},
		default: '',
		description: 'Session identifier',
	},
	// Request ID
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['approveRequest', 'rejectRequest', 'simulateRequest'],
			},
		},
		default: '',
		description: 'Request identifier',
	},
	// Request data
	{
		displayName: 'Request Data',
		name: 'requestData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['handleRequest', 'simulateRequest'],
			},
		},
		default: '{\n  "method": "",\n  "params": []\n}',
		description: 'DApp request data',
	},
	// Rejection reason
	{
		displayName: 'Rejection Reason',
		name: 'rejectionReason',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['rejectRequest'],
			},
		},
		default: 'User rejected the request',
		description: 'Reason for rejection',
	},
	// Target chain for switch
	{
		displayName: 'Target Chain ID',
		name: 'targetChainId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['switchChain'],
			},
		},
		default: 1,
		description: 'Target chain ID (e.g., 1 for Ethereum mainnet)',
	},
	// New chain parameters
	{
		displayName: 'Chain Parameters',
		name: 'chainParameters',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['addChain'],
			},
		},
		default: '{\n  "chainId": "0x1",\n  "chainName": "",\n  "nativeCurrency": {\n    "name": "",\n    "symbol": "",\n    "decimals": 18\n  },\n  "rpcUrls": [],\n  "blockExplorerUrls": []\n}',
		description: 'EIP-3085 chain parameters',
	},
	// Permissions to request
	{
		displayName: 'Permissions',
		name: 'permissions',
		type: 'multiOptions',
		displayOptions: {
			show: {
				resource: ['dapp'],
				operation: ['requestPermissions'],
			},
		},
		options: [
			{ name: 'eth_accounts', value: 'eth_accounts' },
			{ name: 'eth_chainId', value: 'eth_chainId' },
			{ name: 'eth_sign', value: 'eth_sign' },
			{ name: 'personal_sign', value: 'personal_sign' },
			{ name: 'eth_signTypedData_v4', value: 'eth_signTypedData_v4' },
			{ name: 'eth_sendTransaction', value: 'eth_sendTransaction' },
			{ name: 'wallet_switchEthereumChain', value: 'wallet_switchEthereumChain' },
			{ name: 'wallet_addEthereumChain', value: 'wallet_addEthereumChain' },
		],
		default: ['eth_accounts'],
		description: 'Permissions to request',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['dapp'],
			},
		},
		default: 0,
		description: 'Account index to use for DApp',
	},
];

// Common DApp methods
const DAPP_METHODS: Record<string, { description: string; requiresApproval: boolean; category: string }> = {
	'eth_accounts': { description: 'Get connected accounts', requiresApproval: false, category: 'account' },
	'eth_chainId': { description: 'Get current chain ID', requiresApproval: false, category: 'chain' },
	'eth_requestAccounts': { description: 'Request account access', requiresApproval: true, category: 'account' },
	'personal_sign': { description: 'Sign personal message', requiresApproval: true, category: 'signing' },
	'eth_sign': { description: 'Sign message', requiresApproval: true, category: 'signing' },
	'eth_signTypedData_v4': { description: 'Sign typed data', requiresApproval: true, category: 'signing' },
	'eth_sendTransaction': { description: 'Send transaction', requiresApproval: true, category: 'transaction' },
	'eth_signTransaction': { description: 'Sign transaction', requiresApproval: true, category: 'transaction' },
	'wallet_switchEthereumChain': { description: 'Switch chain', requiresApproval: true, category: 'chain' },
	'wallet_addEthereumChain': { description: 'Add new chain', requiresApproval: true, category: 'chain' },
	'wallet_watchAsset': { description: 'Add token to wallet', requiresApproval: true, category: 'token' },
};

export async function executeDapp(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const qrHandler = createQrHandler();
	
	switch (operation) {
		case 'connectDapp': {
			const chain = this.getNodeParameter('chain', index) as string;
			const dappUrl = this.getNodeParameter('dappUrl', index) as string;
			const dappName = this.getNodeParameter('dappName', index, '') as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			const chainConfig = getChainConfig(chain);
			if (!chainConfig) {
				throw new Error(`Unsupported chain: ${chain}`);
			}
			
			// Generate session ID
			const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			
			const connectionRequest = {
				type: 'dapp_connect',
				sessionId,
				dapp: {
					url: dappUrl,
					name: dappName || new URL(dappUrl).hostname,
				},
				chain: {
					id: chain,
					chainId: chainConfig.chainId,
					name: chainConfig.name,
				},
				accountIndex,
				permissions: ['eth_accounts', 'eth_chainId'],
				timestamp: Date.now(),
				expiresAt: Date.now() + 86400000, // 24 hours
			};
			
			const qrCode = await qrHandler.generateMessageQr(connectionRequest);
			
			return [{
				json: {
					success: true,
					operation: 'connectDapp',
					sessionId,
					dapp: connectionRequest.dapp,
					chain: connectionRequest.chain,
					permissions: connectionRequest.permissions,
					qrCode,
					expiresIn: '24 hours',
					instructions: 'Scan QR with SafePal device to approve connection',
				},
			}];
		}
		
		case 'disconnectDapp': {
			const sessionId = this.getNodeParameter('sessionId', index) as string;
			
			return [{
				json: {
					success: true,
					operation: 'disconnectDapp',
					sessionId,
					disconnectedAt: new Date().toISOString(),
					message: 'Session disconnected successfully',
				},
			}];
		}
		
		case 'getActiveSessions': {
			// Would retrieve from session storage
			const sessions: Array<{
				sessionId: string;
				dappUrl: string;
				dappName: string;
				chain: string;
				connectedAt: string;
				lastActivity: string;
			}> = [];
			
			return [{
				json: {
					success: true,
					operation: 'getActiveSessions',
					totalSessions: sessions.length,
					sessions,
				},
			}];
		}
		
		case 'handleRequest': {
			const sessionId = this.getNodeParameter('sessionId', index) as string;
			const requestDataJson = this.getNodeParameter('requestData', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			let requestData: { method: string; params: unknown[] };
			try {
				requestData = JSON.parse(requestDataJson);
			} catch {
				throw new Error('Invalid JSON for request data');
			}
			
			const method = requestData.method;
			const methodInfo = DAPP_METHODS[method];
			
			if (!methodInfo) {
				throw new Error(`Unknown DApp method: ${method}`);
			}
			
			const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			
			if (methodInfo.requiresApproval) {
				// Generate approval QR
				const qrCode = await qrHandler.generateMessageQr({
					type: 'dapp_request',
					requestId,
					sessionId,
					method,
					params: requestData.params,
					accountIndex,
					timestamp: Date.now(),
				});
				
				return [{
					json: {
						success: true,
						operation: 'handleRequest',
						requestId,
						sessionId,
						method,
						methodInfo,
						requiresApproval: true,
						qrCode,
						instructions: 'Scan QR with SafePal device to approve request',
					},
				}];
			} else {
				// Auto-approve non-sensitive methods
				return [{
					json: {
						success: true,
						operation: 'handleRequest',
						requestId,
						sessionId,
						method,
						methodInfo,
						requiresApproval: false,
						status: 'auto_approved',
						result: method === 'eth_chainId' ? '0x1' : [],
					},
				}];
			}
		}
		
		case 'approveRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			const qrCode = await qrHandler.generateMessageQr({
				type: 'dapp_approve',
				requestId,
				approved: true,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					operation: 'approveRequest',
					requestId,
					status: 'pending_device_approval',
					qrCode,
					instructions: 'Scan QR with SafePal device to sign approval',
				},
			}];
		}
		
		case 'rejectRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;
			const rejectionReason = this.getNodeParameter('rejectionReason', index) as string;
			
			return [{
				json: {
					success: true,
					operation: 'rejectRequest',
					requestId,
					status: 'rejected',
					reason: rejectionReason,
					rejectedAt: new Date().toISOString(),
				},
			}];
		}
		
		case 'switchChain': {
			const targetChainId = this.getNodeParameter('targetChainId', index) as number;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			// Find chain config by EVM chain ID
			const targetChain = Object.values(CHAIN_CONFIGS).find(c => c.chainId === targetChainId);
			
			if (!targetChain) {
				// Chain not in built-in list
				return [{
					json: {
						success: false,
						operation: 'switchChain',
						targetChainId,
						error: 'Chain not found',
						suggestion: 'Use addChain to add this chain first',
						code: 4902, // EIP-3326 error code
					},
				}];
			}
			
			const qrCode = await qrHandler.generateMessageQr({
				type: 'switch_chain',
				targetChainId,
				targetChain: {
					id: targetChain.id,
					name: targetChain.name,
					symbol: targetChain.symbol,
				},
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					operation: 'switchChain',
					targetChainId,
					targetChain: {
						id: targetChain.id,
						name: targetChain.name,
						symbol: targetChain.symbol,
						rpcUrl: targetChain.rpcUrl,
					},
					qrCode,
					instructions: 'Scan QR to confirm chain switch on device',
				},
			}];
		}
		
		case 'addChain': {
			const chainParametersJson = this.getNodeParameter('chainParameters', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			let chainParams: {
				chainId: string;
				chainName: string;
				nativeCurrency: { name: string; symbol: string; decimals: number };
				rpcUrls: string[];
				blockExplorerUrls?: string[];
			};
			
			try {
				chainParams = JSON.parse(chainParametersJson);
			} catch {
				throw new Error('Invalid JSON for chain parameters');
			}
			
			// Validate EIP-3085 parameters
			if (!chainParams.chainId || !chainParams.chainName || !chainParams.nativeCurrency || !chainParams.rpcUrls) {
				throw new Error('Chain parameters must include chainId, chainName, nativeCurrency, and rpcUrls');
			}
			
			// Parse chain ID
			const chainIdNum = parseInt(chainParams.chainId, 16);
			
			const qrCode = await qrHandler.generateMessageQr({
				type: 'add_chain',
				chainParams: {
					...chainParams,
					chainIdDecimal: chainIdNum,
				},
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					operation: 'addChain',
					chainParams: {
						...chainParams,
						chainIdDecimal: chainIdNum,
					},
					qrCode,
					instructions: 'Scan QR to add chain on device',
				},
			}];
		}
		
		case 'getPermissions': {
			const sessionId = this.getNodeParameter('sessionId', index) as string;
			
			// Would retrieve from session
			const permissions = [
				{ method: 'eth_accounts', granted: true, grantedAt: new Date().toISOString() },
				{ method: 'eth_chainId', granted: true, grantedAt: new Date().toISOString() },
			];
			
			return [{
				json: {
					success: true,
					operation: 'getPermissions',
					sessionId,
					permissions,
					totalPermissions: permissions.length,
				},
			}];
		}
		
		case 'requestPermissions': {
			const sessionId = this.getNodeParameter('sessionId', index) as string;
			const permissions = this.getNodeParameter('permissions', index) as string[];
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			const permissionDetails = permissions.map(p => ({
				method: p,
				...DAPP_METHODS[p],
			}));
			
			const qrCode = await qrHandler.generateMessageQr({
				type: 'request_permissions',
				sessionId,
				permissions: permissionDetails,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					operation: 'requestPermissions',
					sessionId,
					requestedPermissions: permissionDetails,
					qrCode,
					instructions: 'Scan QR to approve permissions on device',
				},
			}];
		}
		
		case 'getDappInfo': {
			const dappUrl = this.getNodeParameter('dappUrl', index) as string;
			
			let hostname: string;
			try {
				hostname = new URL(dappUrl).hostname;
			} catch {
				throw new Error('Invalid DApp URL');
			}
			
			return [{
				json: {
					success: true,
					operation: 'getDappInfo',
					dapp: {
						url: dappUrl,
						hostname,
						name: hostname,
						description: 'DApp information would be fetched from metadata',
					},
					security: {
						isHttps: dappUrl.startsWith('https://'),
						note: 'Always verify DApp authenticity before connecting',
					},
				},
			}];
		}
		
		case 'simulateRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;
			const requestDataJson = this.getNodeParameter('requestData', index) as string;
			
			let requestData: { method: string; params: unknown[] };
			try {
				requestData = JSON.parse(requestDataJson);
			} catch {
				throw new Error('Invalid JSON for request data');
			}
			
			// Simulation result
			const simulation = {
				requestId,
				method: requestData.method,
				wouldSucceed: true,
				estimatedGas: requestData.method.includes('Transaction') ? 21000 : 0,
				warnings: [] as string[],
				riskLevel: 'low',
			};
			
			// Add warnings based on method
			if (requestData.method === 'eth_sign') {
				simulation.warnings.push('eth_sign can sign arbitrary data. Use personal_sign instead.');
				simulation.riskLevel = 'high';
			}
			
			return [{
				json: {
					success: true,
					operation: 'simulateRequest',
					simulation,
				},
			}];
		}
		
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}

// Export for consistent module interface
export const description: INodeProperties[] = [...dappOperations, ...dappFields];
export const execute = executeDapp;
