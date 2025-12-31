/**
 * SafePal Cardano Blockchain Actions
 * Operations for Cardano blockchain interactions via SafePal hardware wallets
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { CHAIN_CONFIGS } from '../../constants/chains';
import { createQrHandler } from '../../transport/qrHandler';
import { formatAmountWithDecimals, parseAmountWithDecimals } from '../../utils/chainUtils';

const qrHandler = createQrHandler();

export const cardanoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['cardano'],
			},
		},
		options: [
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get Cardano address from SafePal device',
				action: 'Get cardano address',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get ADA balance for an address',
				action: 'Get cardano balance',
			},
			{
				name: 'Send ADA',
				value: 'sendAda',
				description: 'Create transaction to send ADA',
				action: 'Send ada',
			},
			{
				name: 'Send Native Token',
				value: 'sendNativeToken',
				description: 'Send Cardano native tokens',
				action: 'Send native token',
			},
			{
				name: 'Get UTXOs',
				value: 'getUtxos',
				description: 'Get unspent transaction outputs',
				action: 'Get utxos',
			},
			{
				name: 'Get Assets',
				value: 'getAssets',
				description: 'Get native tokens/NFTs for an address',
				action: 'Get assets',
			},
			{
				name: 'Stake ADA',
				value: 'stakeAda',
				description: 'Delegate stake to a pool',
				action: 'Stake ada',
			},
			{
				name: 'Unstake ADA',
				value: 'unstakeAda',
				description: 'Deregister stake key',
				action: 'Unstake ada',
			},
			{
				name: 'Withdraw Rewards',
				value: 'withdrawRewards',
				description: 'Withdraw staking rewards',
				action: 'Withdraw rewards',
			},
			{
				name: 'Get Staking Info',
				value: 'getStakingInfo',
				description: 'Get staking information for an address',
				action: 'Get staking info',
			},
			{
				name: 'Get Stake Pools',
				value: 'getStakePools',
				description: 'Get list of stake pools',
				action: 'Get stake pools',
			},
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign a message with Cardano key',
				action: 'Sign message',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign a CBOR-encoded transaction',
				action: 'Sign transaction',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by hash',
				action: 'Get transaction details',
			},
		],
		default: 'getAddress',
	},
];

export const cardanoFields: INodeProperties[] = [
	// Network selection
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['cardano'],
			},
		},
		options: [
			{ name: 'Mainnet', value: 'mainnet' },
			{ name: 'Preprod', value: 'preprod' },
			{ name: 'Preview', value: 'preview' },
		],
		default: 'mainnet',
		description: 'Cardano network to use',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['getAddress'],
			},
		},
		default: 0,
		description: 'Account index for address derivation (CIP-1852)',
	},
	// Address type
	{
		displayName: 'Address Type',
		name: 'addressType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['getAddress'],
			},
		},
		options: [
			{ name: 'Base (Payment + Staking)', value: 'base' },
			{ name: 'Enterprise (Payment Only)', value: 'enterprise' },
			{ name: 'Reward (Staking)', value: 'reward' },
		],
		default: 'base',
		description: 'Type of Cardano address to generate',
	},
	// Address field
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['getBalance', 'getUtxos', 'getAssets', 'getStakingInfo'],
			},
		},
		default: '',
		placeholder: 'addr1q...',
		description: 'Cardano address (bech32 format)',
	},
	// From address
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['sendAda', 'sendNativeToken', 'stakeAda', 'unstakeAda', 'withdrawRewards'],
			},
		},
		default: '',
		required: true,
		description: 'Sender Cardano address',
	},
	// To address
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['sendAda', 'sendNativeToken'],
			},
		},
		default: '',
		required: true,
		description: 'Recipient Cardano address',
	},
	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['sendAda', 'sendNativeToken'],
			},
		},
		default: '',
		required: true,
		description: 'Amount to send (in ADA)',
	},
	// Native token fields
	{
		displayName: 'Policy ID',
		name: 'policyId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['sendNativeToken'],
			},
		},
		default: '',
		required: true,
		placeholder: '6c...',
		description: 'Policy ID of the native token (hex)',
	},
	{
		displayName: 'Asset Name',
		name: 'assetName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['sendNativeToken'],
			},
		},
		default: '',
		required: true,
		description: 'Asset name (hex or text)',
	},
	{
		displayName: 'Token Amount',
		name: 'tokenAmount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['sendNativeToken'],
			},
		},
		default: '',
		required: true,
		description: 'Amount of tokens to send',
	},
	// Stake pool ID
	{
		displayName: 'Stake Pool ID',
		name: 'poolId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['stakeAda'],
			},
		},
		default: '',
		required: true,
		placeholder: 'pool1...',
		description: 'Bech32 stake pool ID to delegate to',
	},
	// Rewards amount
	{
		displayName: 'Rewards Amount',
		name: 'rewardsAmount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['withdrawRewards'],
			},
		},
		default: '',
		description: 'Amount of rewards to withdraw (empty for all)',
	},
	// Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['signMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Message to sign (CIP-8)',
	},
	// Signer address
	{
		displayName: 'Signer Address',
		name: 'signerAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['signMessage', 'signTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Address to sign with',
	},
	// Raw transaction
	{
		displayName: 'Transaction CBOR',
		name: 'transactionCbor',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['signTransaction'],
			},
		},
		default: '',
		required: true,
		typeOptions: {
			rows: 4,
		},
		description: 'CBOR-encoded unsigned transaction (hex)',
	},
	// Transaction hash
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['getTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Transaction hash to look up',
	},
	// Pool search options
	{
		displayName: 'Pool Search',
		name: 'poolSearch',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['getStakePools'],
			},
		},
		default: '',
		description: 'Search term for stake pool name or ticker',
	},
	// Transaction options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['cardano'],
				operation: ['sendAda', 'sendNativeToken', 'stakeAda', 'unstakeAda', 'withdrawRewards'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Metadata',
				name: 'includeMetadata',
				type: 'boolean',
				default: false,
				description: 'Whether to include transaction metadata',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Transaction metadata (CIP-20)',
			},
			{
				displayName: 'TTL (Slots)',
				name: 'ttl',
				type: 'number',
				default: 7200,
				description: 'Time to live in slots (~2 hours)',
			},
		],
	},
];

// Validate Cardano address (bech32)
function validateCardanoAddress(address: string): boolean {
	// Mainnet addresses start with addr1
	// Testnet addresses start with addr_test1
	// Stake addresses start with stake1 or stake_test1
	const validPrefixes = ['addr1', 'addr_test1', 'stake1', 'stake_test1'];
	return validPrefixes.some(prefix => address.startsWith(prefix));
}

// Get API base URL based on network
function getCardanoApiUrl(network: string): string {
	switch (network) {
		case 'mainnet':
			return 'https://cardano-mainnet.blockfrost.io/api/v0';
		case 'preprod':
			return 'https://cardano-preprod.blockfrost.io/api/v0';
		case 'preview':
			return 'https://cardano-preview.blockfrost.io/api/v0';
		default:
			return 'https://cardano-mainnet.blockfrost.io/api/v0';
	}
}

// Convert ADA to Lovelace (1 ADA = 1,000,000 Lovelace)
function adaToLovelace(ada: string): string {
	return parseAmountWithDecimals(ada, 6);
}

// Convert Lovelace to ADA
function lovelaceToAda(lovelace: string): string {
	return formatAmountWithDecimals(lovelace, 6);
}

export async function executeCardano(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const apiUrl = getCardanoApiUrl(network);
	const chainConfig = CHAIN_CONFIGS['cardano'];

	const results: INodeExecutionData[] = [];

	switch (operation) {
		case 'getAddress': {
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const addressType = this.getNodeParameter('addressType', index, 'base') as string;

			// CIP-1852 derivation path for Cardano
			// m / purpose' / coin_type' / account' / role / index
			const derivationPath = `m/1852'/1815'/${accountIndex}'/0/0`;

			const qrData = await qrHandler.generateSyncQr({
				action: 'get_address',
				chain: 'cardano',
				chainId: chainConfig.chainId || 'cardano',
				derivationPath,
				network,
				addressType,
			});

			results.push({
				json: {
					operation: 'getAddress',
					chain: 'cardano',
					network,
					derivationPath,
					accountIndex,
					addressType,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to get your Cardano address',
				},
			});
			break;
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateCardanoAddress(address)) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid Cardano address format. Must be bech32 (addr1... or addr_test1...)',
				);
			}

			results.push({
				json: {
					operation: 'getBalance',
					chain: 'cardano',
					network,
					address,
					apiUrl,
					endpoint: `/addresses/${address}`,
					note: 'Query the address endpoint to get balance in lovelace',
				},
			});
			break;
		}

		case 'sendAda': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				includeMetadata?: boolean;
				metadata?: string;
				ttl?: number;
			};

			if (!validateCardanoAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Cardano address');
			}
			if (!validateCardanoAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient Cardano address');
			}

			const amountLovelace = adaToLovelace(amount);

			const transactionData: Record<string, unknown> = {
				type: 'simple_transfer',
				from: fromAddress,
				to: toAddress,
				amount: amountLovelace,
				ttl: options.ttl || 7200,
			};

			if (options.includeMetadata && options.metadata) {
				try {
					transactionData.metadata = JSON.parse(options.metadata);
				} catch {
					throw new NodeOperationError(this.getNode(), 'Invalid metadata JSON');
				}
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'cardano',
				chainId: chainConfig.chainId || 'cardano',
				from: fromAddress,
				to: toAddress,
				value: amountLovelace,
				data: JSON.stringify(transactionData),
				type: 'cardano_transfer',
				network,
			});

			results.push({
				json: {
					operation: 'sendAda',
					chain: 'cardano',
					network,
					from: fromAddress,
					to: toAddress,
					amount,
					amountLovelace,
					options,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'sendNativeToken': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const policyId = this.getNodeParameter('policyId', index) as string;
			const assetName = this.getNodeParameter('assetName', index) as string;
			const tokenAmount = this.getNodeParameter('tokenAmount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				ttl?: number;
			};

			if (!validateCardanoAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Cardano address');
			}
			if (!validateCardanoAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient Cardano address');
			}

			const amountLovelace = adaToLovelace(amount);
			const assetUnit = `${policyId}${assetName}`;

			const transactionData = {
				type: 'token_transfer',
				from: fromAddress,
				to: toAddress,
				amount: amountLovelace, // Min ADA for UTXO
				assets: [
					{
						unit: assetUnit,
						policyId,
						assetName,
						quantity: tokenAmount,
					},
				],
				ttl: options.ttl || 7200,
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'cardano',
				chainId: chainConfig.chainId || 'cardano',
				from: fromAddress,
				to: toAddress,
				value: amountLovelace,
				data: JSON.stringify(transactionData),
				type: 'cardano_token_transfer',
				network,
			});

			results.push({
				json: {
					operation: 'sendNativeToken',
					chain: 'cardano',
					network,
					from: fromAddress,
					to: toAddress,
					adaAmount: amount,
					policyId,
					assetName,
					tokenAmount,
					assetUnit,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'getUtxos': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateCardanoAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid Cardano address format');
			}

			results.push({
				json: {
					operation: 'getUtxos',
					chain: 'cardano',
					network,
					address,
					apiUrl,
					endpoint: `/addresses/${address}/utxos`,
					note: 'Query the UTXOs endpoint to get unspent outputs',
				},
			});
			break;
		}

		case 'getAssets': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateCardanoAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid Cardano address format');
			}

			results.push({
				json: {
					operation: 'getAssets',
					chain: 'cardano',
					network,
					address,
					apiUrl,
					endpoint: `/addresses/${address}/assets`,
					note: 'Query the assets endpoint to get native tokens',
				},
			});
			break;
		}

		case 'stakeAda': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const poolId = this.getNodeParameter('poolId', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				ttl?: number;
			};

			if (!validateCardanoAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Cardano address');
			}
			if (!poolId.startsWith('pool1')) {
				throw new NodeOperationError(this.getNode(), 'Invalid stake pool ID format');
			}

			const transactionData = {
				type: 'stake_delegation',
				from: fromAddress,
				poolId,
				certificates: [
					{ type: 'stake_registration' },
					{ type: 'stake_delegation', poolId },
				],
				ttl: options.ttl || 7200,
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'cardano',
				chainId: chainConfig.chainId || 'cardano',
				from: fromAddress,
				data: JSON.stringify(transactionData),
				type: 'cardano_stake_delegation',
				network,
			});

			results.push({
				json: {
					operation: 'stakeAda',
					chain: 'cardano',
					network,
					from: fromAddress,
					poolId,
					depositRequired: '2000000', // 2 ADA deposit for stake key registration
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the delegation',
				},
			});
			break;
		}

		case 'unstakeAda': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				ttl?: number;
			};

			if (!validateCardanoAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Cardano address');
			}

			const transactionData = {
				type: 'stake_deregistration',
				from: fromAddress,
				certificates: [{ type: 'stake_deregistration' }],
				ttl: options.ttl || 7200,
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'cardano',
				chainId: chainConfig.chainId || 'cardano',
				from: fromAddress,
				data: JSON.stringify(transactionData),
				type: 'cardano_stake_deregistration',
				network,
			});

			results.push({
				json: {
					operation: 'unstakeAda',
					chain: 'cardano',
					network,
					from: fromAddress,
					depositRefund: '2000000', // 2 ADA deposit refund
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the deregistration',
				},
			});
			break;
		}

		case 'withdrawRewards': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const rewardsAmount = this.getNodeParameter('rewardsAmount', index, '') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				ttl?: number;
			};

			if (!validateCardanoAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender Cardano address');
			}

			const transactionData: Record<string, unknown> = {
				type: 'rewards_withdrawal',
				from: fromAddress,
				ttl: options.ttl || 7200,
			};

			if (rewardsAmount) {
				transactionData.withdrawalAmount = adaToLovelace(rewardsAmount);
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'cardano',
				chainId: chainConfig.chainId || 'cardano',
				from: fromAddress,
				data: JSON.stringify(transactionData),
				type: 'cardano_rewards_withdrawal',
				network,
			});

			results.push({
				json: {
					operation: 'withdrawRewards',
					chain: 'cardano',
					network,
					from: fromAddress,
					rewardsAmount: rewardsAmount || 'all',
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the withdrawal',
				},
			});
			break;
		}

		case 'getStakingInfo': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateCardanoAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid Cardano address format');
			}

			results.push({
				json: {
					operation: 'getStakingInfo',
					chain: 'cardano',
					network,
					address,
					apiUrl,
					endpoints: {
						account: `/accounts/${address}`,
						rewards: `/accounts/${address}/rewards`,
						delegations: `/accounts/${address}/delegations`,
					},
					note: 'Query the account endpoints to get staking information',
				},
			});
			break;
		}

		case 'getStakePools': {
			const poolSearch = this.getNodeParameter('poolSearch', index, '') as string;

			results.push({
				json: {
					operation: 'getStakePools',
					chain: 'cardano',
					network,
					searchTerm: poolSearch,
					apiUrl,
					endpoint: poolSearch ? `/pools?search=${encodeURIComponent(poolSearch)}` : '/pools',
					note: 'Query the pools endpoint to get stake pool list',
				},
			});
			break;
		}

		case 'signMessage': {
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const message = this.getNodeParameter('message', index) as string;

			if (!validateCardanoAddress(signerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid signer Cardano address');
			}

			// CIP-8 message signing
			const qrData = await qrHandler.generateMessageQr({
				chain: 'cardano',
				chainId: chainConfig.chainId || 'cardano',
				address: signerAddress,
				message,
				type: 'cardano_message_cip8',
				network,
			});

			results.push({
				json: {
					operation: 'signMessage',
					chain: 'cardano',
					network,
					signerAddress,
					message,
					standard: 'CIP-8',
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the message',
				},
			});
			break;
		}

		case 'signTransaction': {
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const transactionCbor = this.getNodeParameter('transactionCbor', index) as string;

			if (!validateCardanoAddress(signerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid signer Cardano address');
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'cardano',
				chainId: chainConfig.chainId || 'cardano',
				from: signerAddress,
				data: transactionCbor,
				type: 'cardano_cbor_transaction',
				network,
			});

			results.push({
				json: {
					operation: 'signTransaction',
					chain: 'cardano',
					network,
					signerAddress,
					transactionCbor,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'getTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;

			results.push({
				json: {
					operation: 'getTransaction',
					chain: 'cardano',
					network,
					txHash,
					apiUrl,
					endpoint: `/txs/${txHash}`,
					explorerUrl: network === 'mainnet'
						? `https://cardanoscan.io/transaction/${txHash}`
						: `https://preprod.cardanoscan.io/transaction/${txHash}`,
					note: 'Query the transaction endpoint for details',
				},
			});
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return results;
}

// Export for consistent module interface
export const description: INodeProperties[] = [...cardanoOperations, ...cardanoFields];
export const execute = executeCardano;
