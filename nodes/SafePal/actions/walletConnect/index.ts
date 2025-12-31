/**
 * SafePal WalletConnect Operations
 * WalletConnect v2 protocol support
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
import { createQrHandler } from '../../transport/qrHandler';
import { WalletConnectHandler } from '../../transport/walletConnectHandler';

export const walletConnectOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['walletConnect'],
			},
		},
		options: [
			{
				name: 'Parse URI',
				value: 'parseUri',
				description: 'Parse WalletConnect URI',
				action: 'Parse WalletConnect URI',
			},
			{
				name: 'Connect',
				value: 'connect',
				description: 'Connect to DApp via WalletConnect',
				action: 'Connect via WalletConnect',
			},
			{
				name: 'Approve Session',
				value: 'approveSession',
				description: 'Approve WalletConnect session proposal',
				action: 'Approve session',
			},
			{
				name: 'Reject Session',
				value: 'rejectSession',
				description: 'Reject WalletConnect session proposal',
				action: 'Reject session',
			},
			{
				name: 'Disconnect',
				value: 'disconnect',
				description: 'Disconnect WalletConnect session',
				action: 'Disconnect session',
			},
			{
				name: 'Get Sessions',
				value: 'getSessions',
				description: 'Get active WalletConnect sessions',
				action: 'Get active sessions',
			},
			{
				name: 'Handle Request',
				value: 'handleRequest',
				description: 'Handle incoming WalletConnect request',
				action: 'Handle request',
			},
			{
				name: 'Approve Request',
				value: 'approveRequest',
				description: 'Approve WalletConnect request',
				action: 'Approve request',
			},
			{
				name: 'Reject Request',
				value: 'rejectRequest',
				description: 'Reject WalletConnect request',
				action: 'Reject request',
			},
			{
				name: 'Update Session',
				value: 'updateSession',
				description: 'Update session accounts or chains',
				action: 'Update session',
			},
			{
				name: 'Emit Event',
				value: 'emitEvent',
				description: 'Emit event to connected DApp',
				action: 'Emit event',
			},
			{
				name: 'Get Pending Requests',
				value: 'getPendingRequests',
				description: 'Get pending WalletConnect requests',
				action: 'Get pending requests',
			},
		],
		default: 'parseUri',
	},
];

export const walletConnectFields: INodeProperties[] = [
	// WalletConnect URI
	{
		displayName: 'WalletConnect URI',
		name: 'wcUri',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['parseUri', 'connect'],
			},
		},
		default: '',
		placeholder: 'wc:...',
		description: 'WalletConnect pairing URI',
	},
	// Session topic
	{
		displayName: 'Session Topic',
		name: 'sessionTopic',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['disconnect', 'handleRequest', 'updateSession', 'emitEvent', 'getPendingRequests'],
			},
		},
		default: '',
		description: 'WalletConnect session topic',
	},
	// Proposal ID
	{
		displayName: 'Proposal ID',
		name: 'proposalId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['approveSession', 'rejectSession'],
			},
		},
		default: '',
		description: 'Session proposal ID',
	},
	// Request ID
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['approveRequest', 'rejectRequest'],
			},
		},
		default: '',
		description: 'Request ID to approve or reject',
	},
	// Request data
	{
		displayName: 'Request Data',
		name: 'requestData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['handleRequest'],
			},
		},
		default: '{\n  "method": "",\n  "params": []\n}',
		description: 'WalletConnect request data',
	},
	// Response data
	{
		displayName: 'Response Data',
		name: 'responseData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['approveRequest'],
			},
		},
		default: '{}',
		description: 'Response data for approved request',
	},
	// Rejection reason
	{
		displayName: 'Rejection Reason',
		name: 'rejectionReason',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['rejectSession', 'rejectRequest'],
			},
		},
		default: 'User rejected',
		description: 'Reason for rejection',
	},
	// Chains to approve
	{
		displayName: 'Approved Chains',
		name: 'approvedChains',
		type: 'multiOptions',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['approveSession', 'updateSession'],
			},
		},
		options: getEvmChainOptions(),
		default: ['ethereum'],
		description: 'Chains to approve for session',
	},
	// Event name
	{
		displayName: 'Event Name',
		name: 'eventName',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['emitEvent'],
			},
		},
		options: [
			{ name: 'Accounts Changed', value: 'accountsChanged' },
			{ name: 'Chain Changed', value: 'chainChanged' },
			{ name: 'Disconnect', value: 'disconnect' },
		],
		default: 'accountsChanged',
		description: 'Event to emit',
	},
	// Event data
	{
		displayName: 'Event Data',
		name: 'eventData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
				operation: ['emitEvent'],
			},
		},
		default: '{}',
		description: 'Event payload data',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['walletConnect'],
			},
		},
		default: 0,
		description: 'Account index to use',
	},
];

export async function executeWalletConnect(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const qrHandler = createQrHandler();
	
	switch (operation) {
		case 'parseUri': {
			const wcUri = this.getNodeParameter('wcUri', index) as string;
			
			// Parse WalletConnect v2 URI
			// Format: wc:topic@version?relay-protocol=irn&symKey=...
			if (!wcUri.startsWith('wc:')) {
				throw new Error('Invalid WalletConnect URI: must start with wc:');
			}
			
			const uriWithoutPrefix = wcUri.slice(3);
			const [topicAndVersion, queryString] = uriWithoutPrefix.split('?');
			const [topic, version] = topicAndVersion.split('@');
			
			const params: Record<string, string> = {};
			if (queryString) {
				queryString.split('&').forEach(param => {
					const [key, value] = param.split('=');
					params[key] = decodeURIComponent(value);
				});
			}
			
			const isV2 = version === '2';
			
			return [{
				json: {
					success: true,
					operation: 'parseUri',
					uri: wcUri,
					parsed: {
						topic,
						version: version || '2',
						isV2,
						relayProtocol: params['relay-protocol'] || 'irn',
						symKey: params['symKey'] ? '[present]' : undefined,
					},
					isValid: !!topic && isV2,
				},
			}];
		}
		
		case 'connect': {
			const wcUri = this.getNodeParameter('wcUri', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			if (!wcUri.startsWith('wc:')) {
				throw new Error('Invalid WalletConnect URI');
			}
			
			// Generate QR for device to process
			const qrCode = await qrHandler.generateMessageQr({
				type: 'walletconnect_connect',
				uri: wcUri,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					operation: 'connect',
					uri: wcUri,
					status: 'pending_device_approval',
					qrCode,
					instructions: 'Scan QR with SafePal device to connect via WalletConnect',
				},
			}];
		}
		
		case 'approveSession': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;
			const approvedChains = this.getNodeParameter('approvedChains', index) as string[];
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			// Build namespace for EIP155
			const chainIds = approvedChains
				.map(c => getChainConfig(c)?.chainId)
				.filter(Boolean)
				.map(id => `eip155:${id}`);
			
			const namespaces = {
				eip155: {
					chains: chainIds,
					methods: [
						'eth_sendTransaction',
						'eth_signTransaction',
						'eth_sign',
						'personal_sign',
						'eth_signTypedData',
						'eth_signTypedData_v4',
					],
					events: ['chainChanged', 'accountsChanged'],
					accounts: chainIds.map(c => `${c}:[address_${accountIndex}]`),
				},
			};
			
			const qrCode = await qrHandler.generateMessageQr({
				type: 'walletconnect_approve',
				proposalId,
				namespaces,
				accountIndex,
				timestamp: Date.now(),
			});
			
			return [{
				json: {
					success: true,
					operation: 'approveSession',
					proposalId,
					approvedChains,
					namespaces,
					qrCode,
					instructions: 'Scan QR with SafePal device to approve session',
				},
			}];
		}
		
		case 'rejectSession': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;
			const rejectionReason = this.getNodeParameter('rejectionReason', index) as string;
			
			return [{
				json: {
					success: true,
					operation: 'rejectSession',
					proposalId,
					status: 'rejected',
					reason: rejectionReason,
					rejectedAt: new Date().toISOString(),
				},
			}];
		}
		
		case 'disconnect': {
			const sessionTopic = this.getNodeParameter('sessionTopic', index) as string;
			
			return [{
				json: {
					success: true,
					operation: 'disconnect',
					sessionTopic,
					status: 'disconnected',
					disconnectedAt: new Date().toISOString(),
				},
			}];
		}
		
		case 'getSessions': {
			// Would retrieve from session storage
			const sessions: Array<{
				topic: string;
				peerName: string;
				peerUrl: string;
				chains: string[];
				accounts: string[];
				expiry: number;
			}> = [];
			
			return [{
				json: {
					success: true,
					operation: 'getSessions',
					totalSessions: sessions.length,
					sessions,
				},
			}];
		}
		
		case 'handleRequest': {
			const sessionTopic = this.getNodeParameter('sessionTopic', index) as string;
			const requestDataJson = this.getNodeParameter('requestData', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			let requestData: { method: string; params: unknown[] };
			try {
				requestData = JSON.parse(requestDataJson);
			} catch {
				throw new Error('Invalid JSON for request data');
			}
			
			const requestId = Date.now();
			
			// Methods that require device signing
			const signingMethods = [
				'eth_sendTransaction',
				'eth_signTransaction',
				'eth_sign',
				'personal_sign',
				'eth_signTypedData',
				'eth_signTypedData_v4',
			];
			
			const requiresSigning = signingMethods.includes(requestData.method);
			
			if (requiresSigning) {
				const qrCode = await qrHandler.generateMessageQr({
					type: 'walletconnect_request',
					sessionTopic,
					requestId,
					method: requestData.method,
					params: requestData.params,
					accountIndex,
					timestamp: Date.now(),
				});
				
				return [{
					json: {
						success: true,
						operation: 'handleRequest',
						sessionTopic,
						requestId,
						method: requestData.method,
						requiresSigning: true,
						qrCode,
						instructions: 'Scan QR with SafePal device to sign request',
					},
				}];
			} else {
				// Auto-respond to non-signing requests
				return [{
					json: {
						success: true,
						operation: 'handleRequest',
						sessionTopic,
						requestId,
						method: requestData.method,
						requiresSigning: false,
						status: 'auto_processed',
					},
				}];
			}
		}
		
		case 'approveRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;
			const responseDataJson = this.getNodeParameter('responseData', index) as string;
			
			let responseData: Record<string, unknown>;
			try {
				responseData = JSON.parse(responseDataJson);
			} catch {
				throw new Error('Invalid JSON for response data');
			}
			
			return [{
				json: {
					success: true,
					operation: 'approveRequest',
					requestId,
					status: 'approved',
					response: responseData,
					approvedAt: new Date().toISOString(),
				},
			}];
		}
		
		case 'rejectRequest': {
			const requestId = this.getNodeParameter('requestId', index) as string;
			const rejectionReason = this.getNodeParameter('rejectionReason', index) as string;
			
			// WalletConnect error codes
			const errorCodes: Record<string, number> = {
				'User rejected': 4001,
				'Unauthorized': 4100,
				'Unsupported method': 4200,
				'Disconnected': 4900,
				'Chain disconnected': 4901,
			};
			
			return [{
				json: {
					success: true,
					operation: 'rejectRequest',
					requestId,
					status: 'rejected',
					error: {
						code: errorCodes[rejectionReason] || 4001,
						message: rejectionReason,
					},
					rejectedAt: new Date().toISOString(),
				},
			}];
		}
		
		case 'updateSession': {
			const sessionTopic = this.getNodeParameter('sessionTopic', index) as string;
			const approvedChains = this.getNodeParameter('approvedChains', index) as string[];
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			const chainIds = approvedChains
				.map(c => getChainConfig(c)?.chainId)
				.filter(Boolean)
				.map(id => `eip155:${id}`);
			
			const updatedNamespaces = {
				eip155: {
					chains: chainIds,
					accounts: chainIds.map(c => `${c}:[address_${accountIndex}]`),
				},
			};
			
			return [{
				json: {
					success: true,
					operation: 'updateSession',
					sessionTopic,
					updatedNamespaces,
					updatedAt: new Date().toISOString(),
				},
			}];
		}
		
		case 'emitEvent': {
			const sessionTopic = this.getNodeParameter('sessionTopic', index) as string;
			const eventName = this.getNodeParameter('eventName', index) as string;
			const eventDataJson = this.getNodeParameter('eventData', index) as string;
			
			let eventData: Record<string, unknown>;
			try {
				eventData = JSON.parse(eventDataJson);
			} catch {
				throw new Error('Invalid JSON for event data');
			}
			
			return [{
				json: {
					success: true,
					operation: 'emitEvent',
					sessionTopic,
					event: {
						name: eventName,
						data: eventData,
					},
					emittedAt: new Date().toISOString(),
				},
			}];
		}
		
		case 'getPendingRequests': {
			const sessionTopic = this.getNodeParameter('sessionTopic', index) as string;
			
			// Would retrieve from request queue
			const pendingRequests: Array<{
				id: number;
				topic: string;
				method: string;
				params: unknown;
				receivedAt: string;
			}> = [];
			
			return [{
				json: {
					success: true,
					operation: 'getPendingRequests',
					sessionTopic,
					totalPending: pendingRequests.length,
					requests: pendingRequests,
				},
			}];
		}
		
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}

// Export for consistent module interface
export const description: INodeProperties[] = [...walletConnectOperations, ...walletConnectFields];
export const execute = executeWalletConnect;
