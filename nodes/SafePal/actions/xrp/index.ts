/**
 * SafePal XRP Ledger Actions
 * Operations for XRP Ledger interactions via SafePal hardware wallets
 */

import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { CHAIN_CONFIGS } from '../../constants/chains';
import { createQrHandler } from '../../transport/qrHandler';
import { validateXrpAddress } from '../../utils/addressUtils';
import { formatAmount, parseAmount } from '../../utils/chainUtils';

const qrHandler = createQrHandler();

export const xrpOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['xrp'],
			},
		},
		options: [
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get XRP address from SafePal device',
				action: 'Get xrp address',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get XRP balance for an address',
				action: 'Get xrp balance',
			},
			{
				name: 'Send XRP',
				value: 'sendXrp',
				description: 'Create transaction to send XRP',
				action: 'Send xrp',
			},
			{
				name: 'Send Token',
				value: 'sendToken',
				description: 'Send issued currency/token',
				action: 'Send xrp token',
			},
			{
				name: 'Get Trust Lines',
				value: 'getTrustLines',
				description: 'Get trust lines for an address',
				action: 'Get trust lines',
			},
			{
				name: 'Set Trust Line',
				value: 'setTrustLine',
				description: 'Set or modify a trust line',
				action: 'Set trust line',
			},
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign a message with XRP account',
				action: 'Sign message',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign a raw XRP transaction',
				action: 'Sign transaction',
			},
			{
				name: 'Get Account Info',
				value: 'getAccountInfo',
				description: 'Get detailed account information',
				action: 'Get account info',
			},
			{
				name: 'Get Transactions',
				value: 'getTransactions',
				description: 'Get transaction history for an address',
				action: 'Get transactions',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by hash',
				action: 'Get transaction details',
			},
			{
				name: 'Create Escrow',
				value: 'createEscrow',
				description: 'Create an escrow payment',
				action: 'Create escrow',
			},
			{
				name: 'Cancel Escrow',
				value: 'cancelEscrow',
				description: 'Cancel an existing escrow',
				action: 'Cancel escrow',
			},
			{
				name: 'Finish Escrow',
				value: 'finishEscrow',
				description: 'Finish/release an escrow',
				action: 'Finish escrow',
			},
		],
		default: 'getAddress',
	},
];

export const xrpFields: INodeProperties[] = [
	// Network selection
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['xrp'],
			},
		},
		options: [
			{ name: 'Mainnet', value: 'mainnet' },
			{ name: 'Testnet', value: 'testnet' },
			{ name: 'Devnet', value: 'devnet' },
		],
		default: 'mainnet',
		description: 'XRP Ledger network to use',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['getAddress'],
			},
		},
		default: 0,
		description: 'Account index for address derivation (BIP44)',
	},
	// Address field
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['getBalance', 'getTrustLines', 'getAccountInfo', 'getTransactions'],
			},
		},
		default: '',
		placeholder: 'rN7n3473SaZBCG4dFL83w7...',
		description: 'XRP address (starts with r)',
	},
	// From address
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['sendXrp', 'sendToken', 'setTrustLine', 'createEscrow', 'cancelEscrow', 'finishEscrow'],
			},
		},
		default: '',
		required: true,
		description: 'Sender XRP address',
	},
	// To address
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['sendXrp', 'sendToken', 'createEscrow'],
			},
		},
		default: '',
		required: true,
		description: 'Recipient XRP address',
	},
	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['sendXrp', 'sendToken', 'createEscrow'],
			},
		},
		default: '',
		required: true,
		description: 'Amount to send (in XRP or token units)',
	},
	// Destination tag
	{
		displayName: 'Destination Tag',
		name: 'destinationTag',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['sendXrp', 'sendToken'],
			},
		},
		default: 0,
		description: 'Optional destination tag for the payment',
	},
	// Token fields for sendToken
	{
		displayName: 'Currency Code',
		name: 'currencyCode',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['sendToken', 'setTrustLine'],
			},
		},
		default: '',
		required: true,
		placeholder: 'USD',
		description: 'Currency code (3 chars) or 40-char hex',
	},
	{
		displayName: 'Issuer Address',
		name: 'issuerAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['sendToken', 'setTrustLine'],
			},
		},
		default: '',
		required: true,
		description: 'Token issuer XRP address',
	},
	// Trust line limit
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['setTrustLine'],
			},
		},
		default: '1000000000',
		description: 'Maximum amount of the issued currency',
	},
	// Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['signMessage'],
			},
		},
		default: '',
		required: true,
		description: 'Message to sign',
	},
	// Signer address
	{
		displayName: 'Signer Address',
		name: 'signerAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['signMessage', 'signTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Address to sign with',
	},
	// Raw transaction
	{
		displayName: 'Raw Transaction',
		name: 'rawTransaction',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['signTransaction'],
			},
		},
		default: '',
		required: true,
		typeOptions: {
			rows: 4,
		},
		description: 'JSON-encoded XRP transaction',
	},
	// Transaction hash
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['getTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Transaction hash to look up',
	},
	// Escrow fields
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['cancelEscrow', 'finishEscrow'],
			},
		},
		default: '',
		required: true,
		description: 'Address that created the escrow',
	},
	{
		displayName: 'Escrow Sequence',
		name: 'escrowSequence',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['cancelEscrow', 'finishEscrow'],
			},
		},
		default: 0,
		required: true,
		description: 'Sequence number of the EscrowCreate transaction',
	},
	{
		displayName: 'Cancel After',
		name: 'cancelAfter',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['createEscrow'],
			},
		},
		default: '',
		description: 'Time when the escrow can be cancelled',
	},
	{
		displayName: 'Finish After',
		name: 'finishAfter',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['createEscrow'],
			},
		},
		default: '',
		description: 'Time when the escrow can be finished',
	},
	{
		displayName: 'Condition',
		name: 'condition',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['createEscrow', 'finishEscrow'],
			},
		},
		default: '',
		description: 'Crypto-condition for the escrow (hex)',
	},
	{
		displayName: 'Fulfillment',
		name: 'fulfillment',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['finishEscrow'],
			},
		},
		default: '',
		description: 'Fulfillment for the crypto-condition (hex)',
	},
	// Transaction options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['xrp'],
				operation: ['sendXrp', 'sendToken', 'setTrustLine', 'createEscrow'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Fee (Drops)',
				name: 'fee',
				type: 'string',
				default: '12',
				description: 'Transaction fee in drops (1 XRP = 1,000,000 drops)',
			},
			{
				displayName: 'Sequence',
				name: 'sequence',
				type: 'number',
				default: -1,
				description: 'Account sequence number (-1 for auto)',
			},
			{
				displayName: 'Source Tag',
				name: 'sourceTag',
				type: 'number',
				default: 0,
				description: 'Source tag for the transaction',
			},
		],
	},
];

// Get RPC URL based on network
function getXrpRpcUrl(network: string): string {
	switch (network) {
		case 'mainnet':
			return 'wss://xrplcluster.com';
		case 'testnet':
			return 'wss://s.altnet.rippletest.net:51233';
		case 'devnet':
			return 'wss://s.devnet.rippletest.net:51233';
		default:
			return 'wss://xrplcluster.com';
	}
}

// Convert XRP to drops (1 XRP = 1,000,000 drops)
function xrpToDrops(xrp: string): string {
	// XRP has 6 decimals
	const parts = xrp.split('.');
	const whole = parts[0] || '0';
	let fraction = parts[1] || '';
	fraction = fraction.padEnd(6, '0').slice(0, 6);
	const drops = whole + fraction;
	return BigInt(drops).toString();
}

// Convert drops to XRP
function dropsToXrp(drops: string): string {
	const value = BigInt(drops);
	const divisor = BigInt(1000000);
	const wholePart = value / divisor;
	const fractionalPart = value % divisor;
	if (fractionalPart === BigInt(0)) {
		return wholePart.toString();
	}
	const fractionalStr = fractionalPart.toString().padStart(6, '0').replace(/0+$/, '');
	return `${wholePart}.${fractionalStr}`;
}

// Convert datetime to ripple epoch
function dateToRippleEpoch(date: string): number {
	const rippleEpoch = new Date('2000-01-01T00:00:00Z').getTime() / 1000;
	const timestamp = new Date(date).getTime() / 1000;
	return Math.floor(timestamp - rippleEpoch);
}

export async function executeXrp(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const rpcUrl = getXrpRpcUrl(network);
	const chainConfig = CHAIN_CONFIGS['xrp'];

	const results: INodeExecutionData[] = [];

	switch (operation) {
		case 'getAddress': {
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const derivationPath = `m/44'/144'/${accountIndex}'/0/0`;

			const syncData = JSON.stringify({
				action: 'get_address',
				chainId: chainConfig.chainId || 'xrp',
				derivationPath,
				network,
			});
			const qrData = await qrHandler.generateSyncQr('xrp', syncData);

			results.push({
				json: {
					operation: 'getAddress',
					chain: 'xrp',
					network,
					derivationPath,
					accountIndex,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to get your XRP address',
				},
			});
			break;
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateXrpAddress(address)) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid XRP address format. Must start with r.',
				);
			}

			results.push({
				json: {
					operation: 'getBalance',
					chain: 'xrp',
					network,
					address,
					rpcUrl,
					rpcMethod: 'account_info',
					rpcParams: { account: address, ledger_index: 'validated' },
					note: 'Query the account_info method to get balance (in drops)',
				},
			});
			break;
		}

		case 'sendXrp': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const destinationTag = this.getNodeParameter('destinationTag', index, 0) as number;
			const options = this.getNodeParameter('options', index, {}) as {
				fee?: string;
				sequence?: number;
				sourceTag?: number;
			};

			if (!validateXrpAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender XRP address');
			}
			if (!validateXrpAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient XRP address');
			}

			const amountDrops = xrpToDrops(amount);

			const transaction: Record<string, unknown> = {
				TransactionType: 'Payment',
				Account: fromAddress,
				Destination: toAddress,
				Amount: amountDrops,
				Fee: options.fee || '12',
			};

			if (destinationTag > 0) {
				transaction.DestinationTag = destinationTag;
			}
			if (options.sourceTag && options.sourceTag > 0) {
				transaction.SourceTag = options.sourceTag;
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'xrp',
				chainId: chainConfig.chainId || 'xrp',
				from: fromAddress,
				to: toAddress,
				value: amountDrops,
				data: JSON.stringify(transaction),
				type: 'xrp_payment',
				network,
			});

			results.push({
				json: {
					operation: 'sendXrp',
					chain: 'xrp',
					network,
					from: fromAddress,
					to: toAddress,
					amount,
					amountDrops,
					destinationTag: destinationTag || undefined,
					transaction,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'sendToken': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const currencyCode = this.getNodeParameter('currencyCode', index) as string;
			const issuerAddress = this.getNodeParameter('issuerAddress', index) as string;
			const destinationTag = this.getNodeParameter('destinationTag', index, 0) as number;
			const options = this.getNodeParameter('options', index, {}) as {
				fee?: string;
				sourceTag?: number;
			};

			if (!validateXrpAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender XRP address');
			}
			if (!validateXrpAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient XRP address');
			}
			if (!validateXrpAddress(issuerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid issuer XRP address');
			}

			const transaction: Record<string, unknown> = {
				TransactionType: 'Payment',
				Account: fromAddress,
				Destination: toAddress,
				Amount: {
					currency: currencyCode,
					issuer: issuerAddress,
					value: amount,
				},
				Fee: options.fee || '12',
			};

			if (destinationTag > 0) {
				transaction.DestinationTag = destinationTag;
			}
			if (options.sourceTag && options.sourceTag > 0) {
				transaction.SourceTag = options.sourceTag;
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'xrp',
				chainId: chainConfig.chainId || 'xrp',
				from: fromAddress,
				to: toAddress,
				value: amount,
				data: JSON.stringify(transaction),
				type: 'xrp_token_payment',
				network,
			});

			results.push({
				json: {
					operation: 'sendToken',
					chain: 'xrp',
					network,
					from: fromAddress,
					to: toAddress,
					amount,
					currency: currencyCode,
					issuer: issuerAddress,
					transaction,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'getTrustLines': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateXrpAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid XRP address format');
			}

			results.push({
				json: {
					operation: 'getTrustLines',
					chain: 'xrp',
					network,
					address,
					rpcUrl,
					rpcMethod: 'account_lines',
					rpcParams: { account: address, ledger_index: 'validated' },
					note: 'Query the account_lines method to get trust lines',
				},
			});
			break;
		}

		case 'setTrustLine': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const currencyCode = this.getNodeParameter('currencyCode', index) as string;
			const issuerAddress = this.getNodeParameter('issuerAddress', index) as string;
			const limit = this.getNodeParameter('limit', index, '1000000000') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				fee?: string;
			};

			if (!validateXrpAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender XRP address');
			}
			if (!validateXrpAddress(issuerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid issuer XRP address');
			}

			const transaction = {
				TransactionType: 'TrustSet',
				Account: fromAddress,
				LimitAmount: {
					currency: currencyCode,
					issuer: issuerAddress,
					value: limit,
				},
				Fee: options.fee || '12',
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'xrp',
				chainId: chainConfig.chainId || 'xrp',
				from: fromAddress,
				data: JSON.stringify(transaction),
				type: 'xrp_trust_set',
				network,
			});

			results.push({
				json: {
					operation: 'setTrustLine',
					chain: 'xrp',
					network,
					from: fromAddress,
					currency: currencyCode,
					issuer: issuerAddress,
					limit,
					transaction,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the trust line transaction',
				},
			});
			break;
		}

		case 'signMessage': {
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const message = this.getNodeParameter('message', index) as string;

			if (!validateXrpAddress(signerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid signer XRP address');
			}

			const qrData = await qrHandler.generateMessageQr({
				chain: 'xrp',
				chainId: chainConfig.chainId || 'xrp',
				address: signerAddress,
				message,
				type: 'xrp_message',
				network,
			});

			results.push({
				json: {
					operation: 'signMessage',
					chain: 'xrp',
					network,
					signerAddress,
					message,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the message',
				},
			});
			break;
		}

		case 'signTransaction': {
			const signerAddress = this.getNodeParameter('signerAddress', index) as string;
			const rawTransaction = this.getNodeParameter('rawTransaction', index) as string;

			if (!validateXrpAddress(signerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid signer XRP address');
			}

			let transaction: IDataObject;
			try {
				transaction = JSON.parse(rawTransaction) as IDataObject;
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON transaction');
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'xrp',
				chainId: chainConfig.chainId || 'xrp',
				from: signerAddress,
				data: rawTransaction,
				type: 'xrp_transaction',
				network,
			});

			results.push({
				json: {
					operation: 'signTransaction',
					chain: 'xrp',
					network,
					signerAddress,
					transaction,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the transaction',
				},
			});
			break;
		}

		case 'getAccountInfo': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateXrpAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid XRP address format');
			}

			results.push({
				json: {
					operation: 'getAccountInfo',
					chain: 'xrp',
					network,
					address,
					rpcUrl,
					rpcMethod: 'account_info',
					rpcParams: { account: address, ledger_index: 'validated', queue: true, signer_lists: true },
					note: 'Query the account_info method for detailed account information',
				},
			});
			break;
		}

		case 'getTransactions': {
			const address = this.getNodeParameter('address', index) as string;

			if (!validateXrpAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid XRP address format');
			}

			results.push({
				json: {
					operation: 'getTransactions',
					chain: 'xrp',
					network,
					address,
					rpcUrl,
					rpcMethod: 'account_tx',
					rpcParams: { account: address, ledger_index_min: -1, ledger_index_max: -1, limit: 100 },
					note: 'Query the account_tx method for transaction history',
				},
			});
			break;
		}

		case 'getTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;

			results.push({
				json: {
					operation: 'getTransaction',
					chain: 'xrp',
					network,
					txHash,
					rpcUrl,
					rpcMethod: 'tx',
					rpcParams: { transaction: txHash, binary: false },
					explorerUrl: network === 'mainnet'
						? `https://xrpscan.com/tx/${txHash}`
						: `https://testnet.xrpl.org/transactions/${txHash}`,
					note: 'Query the tx method for transaction details',
				},
			});
			break;
		}

		case 'createEscrow': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const cancelAfter = this.getNodeParameter('cancelAfter', index, '') as string;
			const finishAfter = this.getNodeParameter('finishAfter', index, '') as string;
			const condition = this.getNodeParameter('condition', index, '') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				fee?: string;
			};

			if (!validateXrpAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender XRP address');
			}
			if (!validateXrpAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid recipient XRP address');
			}

			const amountDrops = xrpToDrops(amount);

			const transaction: Record<string, unknown> = {
				TransactionType: 'EscrowCreate',
				Account: fromAddress,
				Destination: toAddress,
				Amount: amountDrops,
				Fee: options.fee || '12',
			};

			if (cancelAfter) {
				transaction.CancelAfter = dateToRippleEpoch(cancelAfter);
			}
			if (finishAfter) {
				transaction.FinishAfter = dateToRippleEpoch(finishAfter);
			}
			if (condition) {
				transaction.Condition = condition;
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'xrp',
				chainId: chainConfig.chainId || 'xrp',
				from: fromAddress,
				to: toAddress,
				value: amountDrops,
				data: JSON.stringify(transaction),
				type: 'xrp_escrow_create',
				network,
			});

			results.push({
				json: {
					operation: 'createEscrow',
					chain: 'xrp',
					network,
					from: fromAddress,
					to: toAddress,
					amount,
					amountDrops,
					transaction,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the escrow creation',
				},
			});
			break;
		}

		case 'cancelEscrow': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const escrowSequence = this.getNodeParameter('escrowSequence', index) as number;

			if (!validateXrpAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender XRP address');
			}
			if (!validateXrpAddress(ownerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid owner XRP address');
			}

			const transaction = {
				TransactionType: 'EscrowCancel',
				Account: fromAddress,
				Owner: ownerAddress,
				OfferSequence: escrowSequence,
				Fee: '12',
			};

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'xrp',
				chainId: chainConfig.chainId || 'xrp',
				from: fromAddress,
				data: JSON.stringify(transaction),
				type: 'xrp_escrow_cancel',
				network,
			});

			results.push({
				json: {
					operation: 'cancelEscrow',
					chain: 'xrp',
					network,
					from: fromAddress,
					owner: ownerAddress,
					escrowSequence,
					transaction,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the escrow cancellation',
				},
			});
			break;
		}

		case 'finishEscrow': {
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const escrowSequence = this.getNodeParameter('escrowSequence', index) as number;
			const condition = this.getNodeParameter('condition', index, '') as string;
			const fulfillment = this.getNodeParameter('fulfillment', index, '') as string;

			if (!validateXrpAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid sender XRP address');
			}
			if (!validateXrpAddress(ownerAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid owner XRP address');
			}

			const transaction: Record<string, unknown> = {
				TransactionType: 'EscrowFinish',
				Account: fromAddress,
				Owner: ownerAddress,
				OfferSequence: escrowSequence,
				Fee: '12',
			};

			if (condition) {
				transaction.Condition = condition;
			}
			if (fulfillment) {
				transaction.Fulfillment = fulfillment;
			}

			const qrData = await qrHandler.generateTransactionQr({
				chain: 'xrp',
				chainId: chainConfig.chainId || 'xrp',
				from: fromAddress,
				data: JSON.stringify(transaction),
				type: 'xrp_escrow_finish',
				network,
			});

			results.push({
				json: {
					operation: 'finishEscrow',
					chain: 'xrp',
					network,
					from: fromAddress,
					owner: ownerAddress,
					escrowSequence,
					transaction,
					qrCode: qrData,
					instructions: 'Scan this QR code with your SafePal device to sign the escrow finish',
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
export const description: INodeProperties[] = [...xrpOperations, ...xrpFields];
export const execute = executeXrp;
