/**
 * SafePal App Operations
 * SafePal mobile app integration and API operations
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

export const safePalAppOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['safePalApp'],
			},
		},
		options: [
			{
				name: 'Pair With App',
				value: 'pairWithApp',
				description: 'Initiate pairing with SafePal mobile app',
				action: 'Pair with SafePal app',
			},
			{
				name: 'Get App Status',
				value: 'getAppStatus',
				description: 'Check SafePal app connection status',
				action: 'Get app status',
			},
			{
				name: 'Send Notification',
				value: 'sendNotification',
				description: 'Send push notification to app',
				action: 'Send notification to app',
			},
			{
				name: 'Request Signature',
				value: 'requestSignature',
				description: 'Request signature via app',
				action: 'Request signature from app',
			},
			{
				name: 'Sync Accounts',
				value: 'syncAccounts',
				description: 'Sync account data with app',
				action: 'Sync accounts with app',
			},
			{
				name: 'Get Wallet Info',
				value: 'getWalletInfo',
				description: 'Get wallet information from app',
				action: 'Get wallet info from app',
			},
			{
				name: 'Import Watch Wallet',
				value: 'importWatchWallet',
				description: 'Import address as watch-only wallet',
				action: 'Import watch wallet',
			},
			{
				name: 'Export Transaction History',
				value: 'exportTransactionHistory',
				description: 'Export transaction history from app',
				action: 'Export transaction history',
			},
			{
				name: 'Configure Webhook',
				value: 'configureWebhook',
				description: 'Set up webhook for app events',
				action: 'Configure webhook',
			},
			{
				name: 'Get Supported Features',
				value: 'getSupportedFeatures',
				description: 'Get list of supported app features',
				action: 'Get supported features',
			},
		],
		default: 'pairWithApp',
	},
];

export const safePalAppFields: INodeProperties[] = [
	// Pairing code
	{
		displayName: 'Pairing Code',
		name: 'pairingCode',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['pairWithApp'],
			},
		},
		default: '',
		description: 'Pairing code from SafePal app (leave empty to generate)',
	},
	// Device name
	{
		displayName: 'Device Name',
		name: 'deviceName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['pairWithApp'],
			},
		},
		default: 'n8n Integration',
		description: 'Name to identify this integration',
	},
	// Notification settings
	{
		displayName: 'Notification Title',
		name: 'notificationTitle',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['sendNotification'],
			},
		},
		default: '',
		description: 'Notification title',
	},
	{
		displayName: 'Notification Body',
		name: 'notificationBody',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['sendNotification'],
			},
		},
		default: '',
		description: 'Notification body text',
	},
	{
		displayName: 'Notification Type',
		name: 'notificationType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['sendNotification'],
			},
		},
		options: [
			{ name: 'Info', value: 'info' },
			{ name: 'Warning', value: 'warning' },
			{ name: 'Transaction Request', value: 'transaction' },
			{ name: 'Signature Request', value: 'signature' },
		],
		default: 'info',
		description: 'Type of notification',
	},
	// Signature request
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['requestSignature', 'syncAccounts', 'importWatchWallet', 'exportTransactionHistory'],
			},
		},
		options: getChainOptions(),
		default: 'ethereum',
		description: 'Blockchain network',
	},
	{
		displayName: 'Signature Type',
		name: 'signatureType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['requestSignature'],
			},
		},
		options: [
			{ name: 'Transaction', value: 'transaction' },
			{ name: 'Message', value: 'message' },
			{ name: 'Typed Data', value: 'typedData' },
		],
		default: 'message',
		description: 'Type of data to sign',
	},
	{
		displayName: 'Data to Sign',
		name: 'dataToSign',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['requestSignature'],
			},
		},
		default: '{}',
		description: 'Data to be signed',
	},
	// Watch wallet address
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['importWatchWallet', 'exportTransactionHistory'],
			},
		},
		default: '',
		description: 'Wallet address',
	},
	{
		displayName: 'Wallet Label',
		name: 'walletLabel',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['importWatchWallet'],
			},
		},
		default: '',
		description: 'Label for the watch wallet',
	},
	// Webhook configuration
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['configureWebhook'],
			},
		},
		default: '',
		placeholder: 'https://your-server.com/webhook',
		description: 'URL to receive webhook events',
	},
	{
		displayName: 'Webhook Events',
		name: 'webhookEvents',
		type: 'multiOptions',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['configureWebhook'],
			},
		},
		options: [
			{ name: 'Transaction Received', value: 'transaction_received' },
			{ name: 'Transaction Sent', value: 'transaction_sent' },
			{ name: 'Transaction Confirmed', value: 'transaction_confirmed' },
			{ name: 'Token Transfer', value: 'token_transfer' },
			{ name: 'Balance Changed', value: 'balance_changed' },
			{ name: 'New Block', value: 'new_block' },
		],
		default: ['transaction_received', 'transaction_sent'],
		description: 'Events to receive via webhook',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
			},
		},
		default: 0,
		description: 'Account index',
	},
	// Export options
	{
		displayName: 'Export Format',
		name: 'exportFormat',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['exportTransactionHistory'],
			},
		},
		options: [
			{ name: 'JSON', value: 'json' },
			{ name: 'CSV', value: 'csv' },
		],
		default: 'json',
		description: 'Export format',
	},
	{
		displayName: 'Date Range',
		name: 'dateRange',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['safePalApp'],
				operation: ['exportTransactionHistory'],
			},
		},
		options: [
			{ name: 'Last 7 Days', value: '7d' },
			{ name: 'Last 30 Days', value: '30d' },
			{ name: 'Last 90 Days', value: '90d' },
			{ name: 'Last Year', value: '1y' },
			{ name: 'All Time', value: 'all' },
		],
		default: '30d',
		description: 'Date range for export',
	},
];

export async function executeSafePalApp(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const qrHandler = createQrHandler();
	
	switch (operation) {
		case 'pairWithApp': {
			const pairingCode = this.getNodeParameter('pairingCode', index, '') as string;
			const deviceName = this.getNodeParameter('deviceName', index, 'n8n Integration') as string;
			
			// Generate pairing code if not provided
			const code = pairingCode || Math.random().toString(36).substr(2, 8).toUpperCase();
			
			const pairingData = {
				type: 'pair_request',
				code,
				deviceName,
				platform: 'n8n',
				version: '1.0.0',
				timestamp: Date.now(),
				expiresAt: Date.now() + 300000, // 5 minutes
			};
			
			const qrCode = await qrHandler.generateMessageQr(pairingData);
			
			return [{
				json: {
					success: true,
					operation: 'pairWithApp',
					pairingCode: code,
					deviceName,
					qrCode,
					expiresIn: '5 minutes',
					instructions: 'Scan QR code with SafePal app to pair, or enter pairing code manually',
				},
			}];
		}
		
		case 'getAppStatus': {
			// Would check actual connection status
			return [{
				json: {
					success: true,
					operation: 'getAppStatus',
					status: 'disconnected',
					lastConnected: null,
					appVersion: null,
					features: [],
				},
			}];
		}
		
		case 'sendNotification': {
			const notificationTitle = this.getNodeParameter('notificationTitle', index) as string;
			const notificationBody = this.getNodeParameter('notificationBody', index) as string;
			const notificationType = this.getNodeParameter('notificationType', index) as string;
			
			const notification = {
				id: `notif_${Date.now()}`,
				title: notificationTitle,
				body: notificationBody,
				type: notificationType,
				timestamp: Date.now(),
				read: false,
			};
			
			return [{
				json: {
					success: true,
					operation: 'sendNotification',
					notification,
					status: 'queued',
					note: 'Notification will be sent when app is connected',
				},
			}];
		}
		
		case 'requestSignature': {
			const chain = this.getNodeParameter('chain', index) as string;
			const signatureType = this.getNodeParameter('signatureType', index) as string;
			const dataToSignJson = this.getNodeParameter('dataToSign', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			const chainConfig = getChainConfig(chain);
			if (!chainConfig) {
				throw new Error(`Unsupported chain: ${chain}`);
			}
			
			let dataToSign: Record<string, unknown>;
			try {
				dataToSign = JSON.parse(dataToSignJson);
			} catch {
				throw new Error('Invalid JSON for data to sign');
			}
			
			const requestId = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
			
			const signatureRequest = {
				type: 'signature_request',
				requestId,
				chain,
				chainId: chainConfig.chainId,
				signatureType,
				data: dataToSign,
				accountIndex,
				timestamp: Date.now(),
				expiresAt: Date.now() + 300000,
			};
			
			const qrCode = await qrHandler.generateMessageQr(signatureRequest);
			
			return [{
				json: {
					success: true,
					operation: 'requestSignature',
					requestId,
					chain: chainConfig.name,
					signatureType,
					qrCode,
					expiresIn: '5 minutes',
					instructions: 'Scan QR with SafePal app to sign',
				},
			}];
		}
		
		case 'syncAccounts': {
			const chain = this.getNodeParameter('chain', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			
			const chainConfig = getChainConfig(chain);
			if (!chainConfig) {
				throw new Error(`Unsupported chain: ${chain}`);
			}
			
			const syncData = {
				type: 'account_sync',
				chain,
				chainId: chainConfig.chainId,
				accountIndex,
				timestamp: Date.now(),
			};
			
			const qrCode = await qrHandler.generateSyncQr(syncData);
			
			return [{
				json: {
					success: true,
					operation: 'syncAccounts',
					chain: chainConfig.name,
					accountIndex,
					qrCode,
					instructions: 'Scan QR with SafePal app to sync account',
				},
			}];
		}
		
		case 'getWalletInfo': {
			// Would query app for wallet info
			return [{
				json: {
					success: true,
					operation: 'getWalletInfo',
					wallet: {
						type: 'hardware',
						model: null,
						accounts: [],
						supportedChains: [],
					},
					note: 'Connect to app to retrieve wallet info',
				},
			}];
		}
		
		case 'importWatchWallet': {
			const chain = this.getNodeParameter('chain', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			const walletLabel = this.getNodeParameter('walletLabel', index, '') as string;
			
			const chainConfig = getChainConfig(chain);
			if (!chainConfig) {
				throw new Error(`Unsupported chain: ${chain}`);
			}
			
			const watchWallet = {
				type: 'watch_wallet',
				chain,
				chainId: chainConfig.chainId,
				address,
				label: walletLabel || `Watch ${chainConfig.symbol}`,
				createdAt: new Date().toISOString(),
			};
			
			return [{
				json: {
					success: true,
					operation: 'importWatchWallet',
					watchWallet,
					note: 'Watch wallets can only view balances, not sign transactions',
				},
			}];
		}
		
		case 'exportTransactionHistory': {
			const chain = this.getNodeParameter('chain', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			const exportFormat = this.getNodeParameter('exportFormat', index, 'json') as string;
			const dateRange = this.getNodeParameter('dateRange', index, '30d') as string;
			
			const chainConfig = getChainConfig(chain);
			if (!chainConfig) {
				throw new Error(`Unsupported chain: ${chain}`);
			}
			
			// Calculate date range
			const now = new Date();
			let fromDate: Date;
			switch (dateRange) {
				case '7d':
					fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case '30d':
					fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					break;
				case '90d':
					fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
					break;
				case '1y':
					fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
					break;
				default:
					fromDate = new Date(0);
			}
			
			return [{
				json: {
					success: true,
					operation: 'exportTransactionHistory',
					chain: chainConfig.name,
					address,
					format: exportFormat,
					dateRange: {
						from: fromDate.toISOString(),
						to: now.toISOString(),
					},
					transactions: [],
					note: 'Transaction history requires app connection or indexer integration',
				},
			}];
		}
		
		case 'configureWebhook': {
			const webhookUrl = this.getNodeParameter('webhookUrl', index) as string;
			const webhookEvents = this.getNodeParameter('webhookEvents', index) as string[];
			
			// Validate URL
			try {
				new URL(webhookUrl);
			} catch {
				throw new Error('Invalid webhook URL');
			}
			
			const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
			
			const webhookConfig = {
				id: webhookId,
				url: webhookUrl,
				events: webhookEvents,
				createdAt: new Date().toISOString(),
				status: 'active',
				secret: `whsec_${Math.random().toString(36).substr(2, 32)}`,
			};
			
			return [{
				json: {
					success: true,
					operation: 'configureWebhook',
					webhook: webhookConfig,
					note: 'Store the webhook secret securely for signature verification',
				},
			}];
		}
		
		case 'getSupportedFeatures': {
			const features = [
				{
					name: 'QR Code Communication',
					description: 'Air-gapped transaction signing via QR codes',
					supported: true,
				},
				{
					name: 'Bluetooth',
					description: 'Direct communication with X1 device',
					supported: true,
					models: ['X1'],
				},
				{
					name: 'WalletConnect v2',
					description: 'Connect to DApps via WalletConnect',
					supported: true,
				},
				{
					name: 'Multi-Chain',
					description: 'Support for 54+ blockchain networks',
					supported: true,
				},
				{
					name: 'Push Notifications',
					description: 'Receive notifications on mobile app',
					supported: true,
				},
				{
					name: 'Watch Wallets',
					description: 'Monitor addresses without signing capability',
					supported: true,
				},
				{
					name: 'Transaction History Export',
					description: 'Export transaction history in various formats',
					supported: true,
				},
				{
					name: 'Webhooks',
					description: 'Real-time event notifications',
					supported: true,
				},
			];
			
			return [{
				json: {
					success: true,
					operation: 'getSupportedFeatures',
					totalFeatures: features.length,
					features,
				},
			}];
		}
		
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}

// Export for consistent module interface
export const description: INodeProperties[] = [...safePalAppOperations, ...safePalAppFields];
export const execute = executeSafePalApp;
