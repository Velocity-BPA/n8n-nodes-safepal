import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getChainOptions } from './utils/chainUtils';

export class SafePalTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SafePal Trigger',
		name: 'safePalTrigger',
		icon: 'file:safepal.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger workflows on SafePal wallet events',
		defaults: {
			name: 'SafePal Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'safePalNetworkCredentials',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Transaction Received',
						value: 'transaction_received',
						description: 'Trigger when a transaction is received',
					},
					{
						name: 'Transaction Sent',
						value: 'transaction_sent',
						description: 'Trigger when a transaction is sent',
					},
					{
						name: 'Transaction Confirmed',
						value: 'transaction_confirmed',
						description: 'Trigger when a transaction is confirmed',
					},
					{
						name: 'Token Transfer',
						value: 'token_transfer',
						description: 'Trigger on token transfer events',
					},
					{
						name: 'Balance Changed',
						value: 'balance_changed',
						description: 'Trigger when wallet balance changes',
					},
					{
						name: 'New Block',
						value: 'new_block',
						description: 'Trigger on new block mined',
					},
					{
						name: 'Contract Event',
						value: 'contract_event',
						description: 'Trigger on smart contract events',
					},
					{
						name: 'Approval Event',
						value: 'approval_event',
						description: 'Trigger on token approval events',
					},
				],
				default: 'transaction_received',
				description: 'The event to listen for',
			},
			{
				displayName: 'Chain',
				name: 'chain',
				type: 'options',
				options: getChainOptions(),
				default: 'ethereum',
				description: 'The blockchain network to monitor',
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'The wallet address to monitor',
				displayOptions: {
					show: {
						event: [
							'transaction_received',
							'transaction_sent',
							'transaction_confirmed',
							'token_transfer',
							'balance_changed',
							'approval_event',
						],
					},
				},
			},
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'The contract address to monitor',
				displayOptions: {
					show: {
						event: ['contract_event', 'token_transfer', 'approval_event'],
					},
				},
			},
			{
				displayName: 'Event Name',
				name: 'eventName',
				type: 'string',
				default: '',
				placeholder: 'Transfer',
				description: 'The contract event name to filter',
				displayOptions: {
					show: {
						event: ['contract_event'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Confirmations',
						name: 'confirmations',
						type: 'number',
						default: 1,
						description: 'Number of confirmations required before triggering',
					},
					{
						displayName: 'Min Value',
						name: 'minValue',
						type: 'string',
						default: '',
						placeholder: '0.1',
						description: 'Minimum transaction value to trigger (in native units)',
					},
					{
						displayName: 'Token Symbol',
						name: 'tokenSymbol',
						type: 'string',
						default: '',
						placeholder: 'USDT',
						description: 'Filter by specific token symbol',
					},
					{
						displayName: 'Include Internal Transactions',
						name: 'includeInternal',
						type: 'boolean',
						default: false,
						description: 'Whether to include internal/contract transactions',
					},
					{
						displayName: 'Include Token Transfers',
						name: 'includeTokens',
						type: 'boolean',
						default: true,
						description: 'Whether to include ERC20/token transfers',
					},
					{
						displayName: 'Include NFT Transfers',
						name: 'includeNFTs',
						type: 'boolean',
						default: false,
						description: 'Whether to include ERC721/ERC1155 transfers',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const chain = this.getNodeParameter('chain') as string;

				// Check if webhook is already registered
				if (webhookData.webhookId) {
					// In production, you would verify with the blockchain monitoring service
					// For now, we'll simulate the check
					return true;
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const chain = this.getNodeParameter('chain') as string;

				let address: string | undefined;
				let contractAddress: string | undefined;

				try {
					address = this.getNodeParameter('address') as string;
				} catch {
					// Address not required for all events
				}

				try {
					contractAddress = this.getNodeParameter('contractAddress') as string;
				} catch {
					// Contract address not required for all events
				}

				const options = this.getNodeParameter('options', {}) as IDataObject;

				// Build webhook registration payload
				const webhookConfig = {
					url: webhookUrl,
					event,
					chain,
					address,
					contractAddress,
					options,
					createdAt: new Date().toISOString(),
				};

				// In production, this would register with a blockchain monitoring service
				// (e.g., Alchemy, QuickNode, Moralis, or custom indexer)
				// For now, we generate a unique webhook ID
				const webhookId = `sfp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

				webhookData.webhookId = webhookId;
				webhookData.webhookConfig = webhookConfig;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId) {
					// In production, this would deregister with the blockchain monitoring service
					delete webhookData.webhookId;
					delete webhookData.webhookConfig;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const body = this.getBodyData() as IDataObject;
		const event = this.getNodeParameter('event') as string;
		const chain = this.getNodeParameter('chain') as string;
		const options = this.getNodeParameter('options', {}) as IDataObject;

		// Validate the incoming webhook
		if (!body || Object.keys(body).length === 0) {
			throw new NodeOperationError(this.getNode(), 'Empty webhook payload received');
		}

		// Process based on event type
		let outputData: IDataObject = {
			event,
			chain,
			timestamp: new Date().toISOString(),
			raw: body,
		};

		switch (event) {
			case 'transaction_received':
			case 'transaction_sent':
				outputData = {
					...outputData,
					transactionHash: body.hash || body.txHash || body.transactionHash,
					from: body.from,
					to: body.to,
					value: body.value,
					valueFormatted: formatValue(body.value as string, chain),
					gasUsed: body.gasUsed,
					gasPrice: body.gasPrice,
					blockNumber: body.blockNumber,
					blockHash: body.blockHash,
					nonce: body.nonce,
					status: body.status,
				};
				break;

			case 'transaction_confirmed':
				outputData = {
					...outputData,
					transactionHash: body.hash || body.txHash || body.transactionHash,
					confirmations: body.confirmations,
					blockNumber: body.blockNumber,
					blockHash: body.blockHash,
					status: body.status,
				};
				break;

			case 'token_transfer':
				outputData = {
					...outputData,
					transactionHash: body.hash || body.txHash || body.transactionHash,
					from: body.from,
					to: body.to,
					contractAddress: body.contractAddress || body.tokenAddress,
					tokenSymbol: body.symbol || body.tokenSymbol,
					tokenName: body.name || body.tokenName,
					tokenDecimals: body.decimals || body.tokenDecimals,
					value: body.value || body.amount,
					valueFormatted: formatTokenValue(
						body.value as string || body.amount as string,
						body.decimals as number || body.tokenDecimals as number
					),
					tokenId: body.tokenId, // For NFTs
					tokenType: body.tokenType || detectTokenType(body),
				};

				// Apply token symbol filter if specified
				if (options.tokenSymbol && body.symbol !== options.tokenSymbol) {
					return { noWebhookResponse: true };
				}
				break;

			case 'balance_changed':
				outputData = {
					...outputData,
					address: body.address,
					previousBalance: body.previousBalance || body.oldBalance,
					newBalance: body.newBalance || body.balance,
					difference: calculateDifference(
						body.previousBalance as string || body.oldBalance as string,
						body.newBalance as string || body.balance as string
					),
					tokenAddress: body.tokenAddress || body.contractAddress,
					tokenSymbol: body.symbol || body.tokenSymbol,
					isNative: !body.tokenAddress && !body.contractAddress,
				};
				break;

			case 'new_block':
				outputData = {
					...outputData,
					blockNumber: body.blockNumber || body.number,
					blockHash: body.blockHash || body.hash,
					parentHash: body.parentHash,
					timestamp: body.timestamp,
					transactions: body.transactions,
					transactionCount: Array.isArray(body.transactions)
						? body.transactions.length
						: body.transactionCount,
					gasUsed: body.gasUsed,
					gasLimit: body.gasLimit,
					baseFeePerGas: body.baseFeePerGas,
					miner: body.miner,
				};
				break;

			case 'contract_event':
				outputData = {
					...outputData,
					transactionHash: body.transactionHash,
					contractAddress: body.address || body.contractAddress,
					eventName: body.event || body.eventName,
					eventSignature: body.signature || body.eventSignature,
					topics: body.topics,
					data: body.data,
					logIndex: body.logIndex,
					blockNumber: body.blockNumber,
					args: body.args || body.returnValues || decodeEventData(body),
				};
				break;

			case 'approval_event':
				outputData = {
					...outputData,
					transactionHash: body.transactionHash,
					owner: body.owner || body.from,
					spender: body.spender,
					contractAddress: body.address || body.contractAddress,
					tokenSymbol: body.symbol || body.tokenSymbol,
					value: body.value || body.amount,
					isUnlimited: isUnlimitedApproval(body.value as string || body.amount as string),
				};
				break;
		}

		// Apply minimum value filter if specified
		if (options.minValue && outputData.value) {
			const minValue = parseFloat(options.minValue as string);
			const actualValue = parseFloat(outputData.valueFormatted as string || outputData.value as string);
			if (actualValue < minValue) {
				return { noWebhookResponse: true };
			}
		}

		// Apply confirmations filter if specified
		if (options.confirmations && outputData.confirmations !== undefined) {
			const requiredConfirmations = options.confirmations as number;
			const actualConfirmations = outputData.confirmations as number;
			if (actualConfirmations < requiredConfirmations) {
				return { noWebhookResponse: true };
			}
		}

		return {
			workflowData: [
				[
					{
						json: outputData,
					},
				],
			],
		};
	}
}

// Helper functions

function formatValue(value: string | undefined, chain: string): string {
	if (!value) return '0';

	try {
		const wei = BigInt(value);
		const decimals = getChainDecimals(chain);
		const divisor = BigInt(10 ** decimals);
		const whole = wei / divisor;
		const fraction = wei % divisor;

		if (fraction === BigInt(0)) {
			return `${whole} ${getChainSymbol(chain)}`;
		}

		const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
		return `${whole}.${fractionStr} ${getChainSymbol(chain)}`;
	} catch {
		return value;
	}
}

function formatTokenValue(value: string | undefined, decimals: number | undefined): string {
	if (!value) return '0';
	if (!decimals) return value;

	try {
		const amount = BigInt(value);
		const divisor = BigInt(10 ** decimals);
		const whole = amount / divisor;
		const fraction = amount % divisor;

		if (fraction === BigInt(0)) {
			return whole.toString();
		}

		const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
		return `${whole}.${fractionStr}`;
	} catch {
		return value;
	}
}

function calculateDifference(oldValue: string | undefined, newValue: string | undefined): string {
	if (!oldValue || !newValue) return '0';

	try {
		const diff = BigInt(newValue) - BigInt(oldValue);
		return diff.toString();
	} catch {
		return '0';
	}
}

function detectTokenType(data: IDataObject): string {
	if (data.tokenId !== undefined) {
		return data.amount === '1' ? 'ERC721' : 'ERC1155';
	}
	return 'ERC20';
}

function decodeEventData(data: IDataObject): IDataObject {
	// In production, this would decode event data using ABI
	const result = data.args || data.returnValues || {};
	return result as IDataObject;
}

function isUnlimitedApproval(value: string | undefined): boolean {
	if (!value) return false;

	try {
		const amount = BigInt(value);
		// Max uint256 is 2^256 - 1
		const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
		// Consider unlimited if >= 50% of max uint256
		return amount >= maxUint256 / BigInt(2);
	} catch {
		return false;
	}
}

function getChainDecimals(chain: string): number {
	const decimals: Record<string, number> = {
		ethereum: 18,
		bsc: 18,
		polygon: 18,
		avalanche: 18,
		fantom: 18,
		arbitrum: 18,
		optimism: 18,
		solana: 9,
		bitcoin: 8,
		tron: 6,
		cosmos: 6,
		near: 24,
		aptos: 8,
		sui: 9,
		xrp: 6,
		cardano: 6,
		polkadot: 10,
	};
	return decimals[chain] || 18;
}

function getChainSymbol(chain: string): string {
	const symbols: Record<string, string> = {
		ethereum: 'ETH',
		bsc: 'BNB',
		polygon: 'MATIC',
		avalanche: 'AVAX',
		fantom: 'FTM',
		arbitrum: 'ETH',
		optimism: 'ETH',
		solana: 'SOL',
		bitcoin: 'BTC',
		tron: 'TRX',
		cosmos: 'ATOM',
		near: 'NEAR',
		aptos: 'APT',
		sui: 'SUI',
		xrp: 'XRP',
		cardano: 'ADA',
		polkadot: 'DOT',
	};
	return symbols[chain] || chain.toUpperCase();
}
