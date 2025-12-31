/**
 * SafePal Utility Operations
 * Encoding, hashing, formatting, and helper utilities
 * 
 * SPDX-License-Identifier: BSL-1.1
 */

import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { getChainConfig } from '../../constants/chains';
import { getChainOptions } from '../../utils/chainUtils';

// Unit conversion factors (relative to wei)
const UNIT_FACTORS: Record<string, bigint> = {
	wei: BigInt(1),
	kwei: BigInt(1000),
	mwei: BigInt(1000000),
	gwei: BigInt(1000000000),
	microether: BigInt(1000000000000),
	milliether: BigInt(1000000000000000),
	ether: BigInt(1000000000000000000),
};

// Base58 alphabet
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const description: INodeProperties[] = [
	// Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Encode Hex',
				value: 'encodeHex',
				description: 'Encode string or bytes to hex',
				action: 'Encode to hex',
			},
			{
				name: 'Decode Hex',
				value: 'decodeHex',
				description: 'Decode hex to string or bytes',
				action: 'Decode from hex',
			},
			{
				name: 'Encode Base58',
				value: 'encodeBase58',
				description: 'Encode bytes to Base58',
				action: 'Encode to base58',
			},
			{
				name: 'Decode Base58',
				value: 'decodeBase58',
				description: 'Decode Base58 to bytes',
				action: 'Decode from base58',
			},
			{
				name: 'Encode Base64',
				value: 'encodeBase64',
				description: 'Encode string to Base64',
				action: 'Encode to base64',
			},
			{
				name: 'Decode Base64',
				value: 'decodeBase64',
				description: 'Decode Base64 to string',
				action: 'Decode from base64',
			},
			{
				name: 'Hash Data',
				value: 'hashData',
				description: 'Hash data with various algorithms',
				action: 'Hash data',
			},
			{
				name: 'Convert Units',
				value: 'convertUnits',
				description: 'Convert between wei/gwei/ether',
				action: 'Convert units',
			},
			{
				name: 'Format Address',
				value: 'formatAddress',
				description: 'Format address for display',
				action: 'Format address',
			},
			{
				name: 'Parse Amount',
				value: 'parseAmount',
				description: 'Parse human-readable amount to wei',
				action: 'Parse amount',
			},
			{
				name: 'Format Amount',
				value: 'formatAmount',
				description: 'Format wei to human-readable',
				action: 'Format amount',
			},
			{
				name: 'Generate Random',
				value: 'generateRandom',
				description: 'Generate random bytes or numbers',
				action: 'Generate random',
			},
			{
				name: 'Pad Hex',
				value: 'padHex',
				description: 'Pad hex value to specific length',
				action: 'Pad hex',
			},
			{
				name: 'Calculate Gas Cost',
				value: 'calculateGasCost',
				description: 'Calculate transaction gas cost',
				action: 'Calculate gas cost',
			},
		],
		default: 'encodeHex',
	},

	// Input for encoding/decoding
	{
		displayName: 'Input',
		name: 'input',
		type: 'string',
		default: '',
		required: true,
		description: 'Input data to process',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: [
					'encodeHex',
					'decodeHex',
					'encodeBase58',
					'decodeBase58',
					'encodeBase64',
					'decodeBase64',
					'hashData',
					'padHex',
				],
			},
		},
	},

	// Hash algorithm
	{
		displayName: 'Algorithm',
		name: 'algorithm',
		type: 'options',
		options: [
			{ name: 'SHA256', value: 'sha256' },
			{ name: 'SHA3-256', value: 'sha3-256' },
			{ name: 'MD5 (Not Secure)', value: 'md5' },
		],
		default: 'sha256',
		description: 'Hash algorithm to use',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['hashData'],
			},
		},
	},

	// Unit conversion
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		default: '0',
		required: true,
		description: 'Value to convert',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits', 'parseAmount', 'formatAmount'],
			},
		},
	},
	{
		displayName: 'From Unit',
		name: 'fromUnit',
		type: 'options',
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Kwei (Babbage)', value: 'kwei' },
			{ name: 'Mwei (Lovelace)', value: 'mwei' },
			{ name: 'Gwei (Shannon)', value: 'gwei' },
			{ name: 'Microether (Szabo)', value: 'microether' },
			{ name: 'Milliether (Finney)', value: 'milliether' },
			{ name: 'Ether', value: 'ether' },
		],
		default: 'wei',
		description: 'Source unit',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
	},
	{
		displayName: 'To Unit',
		name: 'toUnit',
		type: 'options',
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Kwei (Babbage)', value: 'kwei' },
			{ name: 'Mwei (Lovelace)', value: 'mwei' },
			{ name: 'Gwei (Shannon)', value: 'gwei' },
			{ name: 'Microether (Szabo)', value: 'microether' },
			{ name: 'Milliether (Finney)', value: 'milliether' },
			{ name: 'Ether', value: 'ether' },
		],
		default: 'ether',
		description: 'Target unit',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
	},

	// Chain for formatting
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: getChainOptions(),
		default: 'ethereum',
		description: 'Blockchain network',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['formatAddress', 'parseAmount', 'formatAmount', 'calculateGasCost'],
			},
		},
	},

	// Address formatting
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Address to format',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['formatAddress'],
			},
		},
	},
	{
		displayName: 'Format Type',
		name: 'formatType',
		type: 'options',
		options: [
			{ name: 'Checksum', value: 'checksum' },
			{ name: 'Lowercase', value: 'lowercase' },
			{ name: 'Uppercase', value: 'uppercase' },
			{ name: 'Shortened (0x1234...5678)', value: 'shortened' },
		],
		default: 'checksum',
		description: 'How to format the address',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['formatAddress'],
			},
		},
	},

	// Decimals for amount parsing/formatting
	{
		displayName: 'Decimals',
		name: 'decimals',
		type: 'number',
		default: 18,
		description: 'Token decimals (18 for ETH/ERC20, 8 for BTC)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['parseAmount', 'formatAmount'],
			},
		},
	},

	// Random generation
	{
		displayName: 'Random Type',
		name: 'randomType',
		type: 'options',
		options: [
			{ name: 'Bytes (Hex)', value: 'bytes' },
			{ name: 'Number', value: 'number' },
			{ name: 'UUID', value: 'uuid' },
		],
		default: 'bytes',
		description: 'Type of random data to generate',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['generateRandom'],
			},
		},
	},
	{
		displayName: 'Byte Length',
		name: 'byteLength',
		type: 'number',
		default: 32,
		description: 'Number of random bytes to generate',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['generateRandom'],
				randomType: ['bytes'],
			},
		},
	},
	{
		displayName: 'Min',
		name: 'min',
		type: 'number',
		default: 0,
		description: 'Minimum value (inclusive)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['generateRandom'],
				randomType: ['number'],
			},
		},
	},
	{
		displayName: 'Max',
		name: 'max',
		type: 'number',
		default: 1000000,
		description: 'Maximum value (inclusive)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['generateRandom'],
				randomType: ['number'],
			},
		},
	},

	// Hex padding
	{
		displayName: 'Target Length',
		name: 'targetLength',
		type: 'number',
		default: 64,
		description: 'Target length in hex characters (not including 0x)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['padHex'],
			},
		},
	},
	{
		displayName: 'Pad Side',
		name: 'padSide',
		type: 'options',
		options: [
			{ name: 'Left (For Numbers)', value: 'left' },
			{ name: 'Right (For Strings)', value: 'right' },
		],
		default: 'left',
		description: 'Which side to pad',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['padHex'],
			},
		},
	},

	// Gas calculation
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'number',
		default: 21000,
		description: 'Gas limit for transaction',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateGasCost'],
			},
		},
	},
	{
		displayName: 'Gas Price (Gwei)',
		name: 'gasPrice',
		type: 'number',
		default: 20,
		description: 'Gas price in Gwei',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateGasCost'],
			},
		},
	},
	{
		displayName: 'Include Priority Fee',
		name: 'includePriorityFee',
		type: 'boolean',
		default: false,
		description: 'Whether to include EIP-1559 priority fee',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateGasCost'],
			},
		},
	},
	{
		displayName: 'Priority Fee (Gwei)',
		name: 'priorityFee',
		type: 'number',
		default: 2,
		description: 'Priority fee in Gwei (EIP-1559)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateGasCost'],
				includePriorityFee: [true],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const crypto = require('crypto');
	let result: IDataObject = {};

	switch (operation) {
		case 'encodeHex': {
			const input = this.getNodeParameter('input', index) as string;

			if (/^(0x)?[a-fA-F0-9]+$/.test(input)) {
				const hex = input.startsWith('0x') ? input : `0x${input}`;
				result = {
					success: true,
					input,
					hex,
					type: 'already_hex',
				};
			} else {
				const hex = '0x' + Buffer.from(input, 'utf8').toString('hex');
				result = {
					success: true,
					input,
					hex,
					byteLength: Buffer.from(input, 'utf8').length,
					type: 'string_to_hex',
				};
			}
			break;
		}

		case 'decodeHex': {
			const input = this.getNodeParameter('input', index) as string;
			const cleanHex = input.startsWith('0x') ? input.slice(2) : input;

			if (!/^[a-fA-F0-9]+$/.test(cleanHex)) {
				throw new NodeOperationError(this.getNode(), 'Invalid hex string', { itemIndex: index });
			}

			const buffer = Buffer.from(cleanHex, 'hex');
			result = {
				success: true,
				input,
				decoded: buffer.toString('utf8'),
				bytes: Array.from(buffer),
				byteLength: buffer.length,
			};
			break;
		}

		case 'encodeBase58': {
			const input = this.getNodeParameter('input', index) as string;

			let bytes: Buffer;
			if (/^(0x)?[a-fA-F0-9]+$/.test(input)) {
				const cleanHex = input.startsWith('0x') ? input.slice(2) : input;
				bytes = Buffer.from(cleanHex, 'hex');
			} else {
				bytes = Buffer.from(input, 'utf8');
			}

			let num = BigInt('0x' + bytes.toString('hex'));
			let encoded = '';

			while (num > 0n) {
				const remainder = Number(num % 58n);
				encoded = BASE58_ALPHABET[remainder] + encoded;
				num = num / 58n;
			}

			for (const byte of bytes) {
				if (byte === 0) {
					encoded = '1' + encoded;
				} else {
					break;
				}
			}

			result = {
				success: true,
				input,
				base58: encoded,
				inputByteLength: bytes.length,
			};
			break;
		}

		case 'decodeBase58': {
			const input = this.getNodeParameter('input', index) as string;

			for (const char of input) {
				if (!BASE58_ALPHABET.includes(char)) {
					throw new NodeOperationError(this.getNode(), `Invalid Base58 character: ${char}`, { itemIndex: index });
				}
			}

			let num = BigInt(0);
			for (const char of input) {
				num = num * 58n + BigInt(BASE58_ALPHABET.indexOf(char));
			}

			let hex = num.toString(16);
			if (hex.length % 2) hex = '0' + hex;

			let leadingZeros = 0;
			for (const char of input) {
				if (char === '1') leadingZeros++;
				else break;
			}
			hex = '00'.repeat(leadingZeros) + hex;

			result = {
				success: true,
				input,
				hex: '0x' + hex,
				bytes: Array.from(Buffer.from(hex, 'hex')),
			};
			break;
		}

		case 'encodeBase64': {
			const input = this.getNodeParameter('input', index) as string;
			const base64 = Buffer.from(input, 'utf8').toString('base64');

			result = {
				success: true,
				input,
				base64,
				urlSafe: base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
			};
			break;
		}

		case 'decodeBase64': {
			const input = this.getNodeParameter('input', index) as string;

			let normalized = input.replace(/-/g, '+').replace(/_/g, '/');
			while (normalized.length % 4) {
				normalized += '=';
			}

			const decoded = Buffer.from(normalized, 'base64').toString('utf8');

			result = {
				success: true,
				input,
				decoded,
			};
			break;
		}

		case 'hashData': {
			const input = this.getNodeParameter('input', index) as string;
			const algorithm = this.getNodeParameter('algorithm', index) as string;

			let buffer: Buffer;
			if (/^(0x)?[a-fA-F0-9]+$/.test(input)) {
				const cleanHex = input.startsWith('0x') ? input.slice(2) : input;
				buffer = Buffer.from(cleanHex, 'hex');
			} else {
				buffer = Buffer.from(input, 'utf8');
			}

			let hash: string;
			try {
				hash = crypto.createHash(algorithm).update(buffer).digest('hex');
			} catch {
				hash = crypto.createHash('sha256').update(buffer).digest('hex');
			}

			result = {
				success: true,
				input,
				algorithm,
				hash: '0x' + hash,
				hashLength: hash.length / 2,
			};
			break;
		}

		case 'convertUnits': {
			const value = this.getNodeParameter('value', index) as string;
			const fromUnit = this.getNodeParameter('fromUnit', index) as string;
			const toUnit = this.getNodeParameter('toUnit', index) as string;

			let weiValue: bigint;
			if (value.includes('.')) {
				const [whole, decimal] = value.split('.');
				const fromFactor = UNIT_FACTORS[fromUnit];
				const factorStr = fromFactor.toString();
				const factorDecimals = factorStr.length - 1;

				const paddedDecimal = decimal.padEnd(factorDecimals, '0').slice(0, factorDecimals);
				weiValue = BigInt(whole || '0') * fromFactor + BigInt(paddedDecimal);
			} else {
				weiValue = BigInt(value) * UNIT_FACTORS[fromUnit];
			}

			const toFactor = UNIT_FACTORS[toUnit];
			const wholePart = weiValue / toFactor;
			const remainderPart = weiValue % toFactor;

			let converted: string;
			if (remainderPart === 0n) {
				converted = wholePart.toString();
			} else {
				const factorStr = toFactor.toString();
				const decimals = factorStr.length - 1;
				const remainderStr = remainderPart.toString().padStart(decimals, '0');
				converted = `${wholePart}.${remainderStr}`.replace(/\.?0+$/, '');
			}

			result = {
				success: true,
				input: value,
				fromUnit,
				toUnit,
				converted,
				weiValue: weiValue.toString(),
			};
			break;
		}

		case 'formatAddress': {
			const chain = this.getNodeParameter('chain', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			const formatType = this.getNodeParameter('formatType', index) as string;

			let formatted: string;

			switch (formatType) {
				case 'lowercase':
					formatted = address.toLowerCase();
					break;
				case 'uppercase':
					formatted = address.toUpperCase();
					break;
				case 'shortened':
					formatted = address.length > 12
						? `${address.slice(0, 6)}...${address.slice(-4)}`
						: address;
					break;
				case 'checksum':
					if (address.startsWith('0x') && address.length === 42) {
						const cleanAddr = address.slice(2).toLowerCase();
						formatted = '0x' + cleanAddr.split('').map((c) =>
							parseInt(c, 16) > 7 ? c.toUpperCase() : c
						).join('');
					} else {
						formatted = address;
					}
					break;
				default:
					formatted = address;
			}

			result = {
				success: true,
				original: address,
				formatted,
				formatType,
				chain,
			};
			break;
		}

		case 'parseAmount': {
			const value = this.getNodeParameter('value', index) as string;
			const decimals = this.getNodeParameter('decimals', index) as number;
			const chain = this.getNodeParameter('chain', index) as string;

			let parsed: string;

			if (value.includes('.')) {
				const [whole, decimal] = value.split('.');
				const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
				parsed = (BigInt(whole || '0') * BigInt(10 ** decimals) + BigInt(paddedDecimal)).toString();
			} else {
				parsed = (BigInt(value) * BigInt(10 ** decimals)).toString();
			}

			result = {
				success: true,
				input: value,
				parsed,
				decimals,
				chain,
				hex: '0x' + BigInt(parsed).toString(16),
			};
			break;
		}

		case 'formatAmount': {
			const value = this.getNodeParameter('value', index) as string;
			const decimals = this.getNodeParameter('decimals', index) as number;
			const chain = this.getNodeParameter('chain', index) as string;

			const bigValue = BigInt(value);
			const divisor = BigInt(10 ** decimals);
			const whole = bigValue / divisor;
			const remainder = bigValue % divisor;

			let formatted: string;
			if (remainder === 0n) {
				formatted = whole.toString();
			} else {
				const remainderStr = remainder.toString().padStart(decimals, '0');
				formatted = `${whole}.${remainderStr}`.replace(/\.?0+$/, '');
			}

			result = {
				success: true,
				input: value,
				formatted,
				decimals,
				chain,
			};
			break;
		}

		case 'generateRandom': {
			const randomType = this.getNodeParameter('randomType', index) as string;

			switch (randomType) {
				case 'bytes': {
					const byteLength = this.getNodeParameter('byteLength', index) as number;
					const bytes = crypto.randomBytes(byteLength);
					result = {
						success: true,
						type: 'bytes',
						hex: '0x' + bytes.toString('hex'),
						bytes: Array.from(bytes),
						length: byteLength,
					};
					break;
				}
				case 'number': {
					const min = this.getNodeParameter('min', index) as number;
					const max = this.getNodeParameter('max', index) as number;
					const range = max - min + 1;
					const randomValue = crypto.randomInt(range) + min;
					result = {
						success: true,
						type: 'number',
						value: randomValue,
						min,
						max,
					};
					break;
				}
				case 'uuid': {
					const uuid = crypto.randomUUID();
					result = {
						success: true,
						type: 'uuid',
						uuid,
						version: 4,
					};
					break;
				}
			}
			break;
		}

		case 'padHex': {
			const input = this.getNodeParameter('input', index) as string;
			const targetLength = this.getNodeParameter('targetLength', index) as number;
			const padSide = this.getNodeParameter('padSide', index) as string;

			const cleanHex = input.startsWith('0x') ? input.slice(2) : input;

			if (!/^[a-fA-F0-9]*$/.test(cleanHex)) {
				throw new NodeOperationError(this.getNode(), 'Invalid hex string', { itemIndex: index });
			}

			const padded = padSide === 'left'
				? cleanHex.padStart(targetLength, '0')
				: cleanHex.padEnd(targetLength, '0');

			result = {
				success: true,
				input,
				padded: '0x' + padded,
				originalLength: cleanHex.length,
				paddedLength: padded.length,
				padSide,
			};
			break;
		}

		case 'calculateGasCost': {
			const chain = this.getNodeParameter('chain', index) as string;
			const gasLimit = this.getNodeParameter('gasLimit', index) as number;
			const gasPrice = this.getNodeParameter('gasPrice', index) as number;
			const includePriorityFee = this.getNodeParameter('includePriorityFee', index) as boolean;

			const gasPriceWei = BigInt(Math.floor(gasPrice * 1e9));
			let totalGasPrice = gasPriceWei;

			if (includePriorityFee) {
				const priorityFee = this.getNodeParameter('priorityFee', index) as number;
				const priorityFeeWei = BigInt(Math.floor(priorityFee * 1e9));
				totalGasPrice = gasPriceWei + priorityFeeWei;
			}

			const totalCostWei = totalGasPrice * BigInt(gasLimit);
			const totalCostEther = Number(totalCostWei) / 1e18;

			const chainConfig = getChainConfig(chain);
			const nativeSymbol = chainConfig?.symbol || 'ETH';

			result = {
				success: true,
				chain,
				gasLimit,
				gasPrice: `${gasPrice} Gwei`,
				totalGasPrice: `${Number(totalGasPrice) / 1e9} Gwei`,
				costWei: totalCostWei.toString(),
				costEther: totalCostEther.toFixed(8),
				cost: `${totalCostEther.toFixed(6)} ${nativeSymbol}`,
			};

			if (includePriorityFee) {
				result.priorityFee = `${this.getNodeParameter('priorityFee', index)} Gwei`;
			}
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: index });
	}

	return [{ json: result }];
}
