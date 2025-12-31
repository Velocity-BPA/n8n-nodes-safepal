/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { 
	IDataObject,
	IExecuteFunctions, 
	INodeExecutionData, 
	INodeProperties 
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { QrHandler } from '../../transport/qrHandler';
import { QR_ERROR_CORRECTION, QR_DATA_TYPES } from '../../constants/qrFormats';

const qrHandler = new QrHandler();

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['qrCode'],
			},
		},
		options: [
			{
				name: 'Generate',
				value: 'generate',
				description: 'Generate a QR code for device scanning',
				action: 'Generate QR code',
			},
			{
				name: 'Generate Transaction QR',
				value: 'generateTransaction',
				description: 'Generate QR code for transaction signing',
				action: 'Generate transaction QR',
			},
			{
				name: 'Generate Message QR',
				value: 'generateMessage',
				description: 'Generate QR code for message signing',
				action: 'Generate message QR',
			},
			{
				name: 'Parse',
				value: 'parse',
				description: 'Parse QR code data from device',
				action: 'Parse QR code',
			},
			{
				name: 'Parse Signature',
				value: 'parseSignature',
				description: 'Parse signature QR from device',
				action: 'Parse signature QR',
			},
			{
				name: 'Generate Animated',
				value: 'generateAnimated',
				description: 'Generate animated QR code for large data',
				action: 'Generate animated QR',
			},
			{
				name: 'Merge Frames',
				value: 'mergeFrames',
				description: 'Merge animated QR frames',
				action: 'Merge QR frames',
			},
			{
				name: 'Validate',
				value: 'validate',
				description: 'Validate QR code format',
				action: 'Validate QR code',
			},
		],
		default: 'generate',
	},
	// QR Data
	{
		displayName: 'Data',
		name: 'qrData',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['qrCode'],
				operation: ['generate', 'generateAnimated', 'parse', 'parseSignature', 'validate'],
			},
		},
		description: 'The data to encode or decode',
	},
	// Chain for transaction/message QR
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'string',
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['qrCode'],
				operation: ['generateTransaction', 'generateMessage'],
			},
		},
		description: 'The blockchain chain ID',
	},
	// Transaction data
	{
		displayName: 'Transaction Data',
		name: 'transactionData',
		type: 'string',
		default: '',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['qrCode'],
				operation: ['generateTransaction'],
			},
		},
		description: 'The unsigned transaction data (JSON or hex)',
	},
	// Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['qrCode'],
				operation: ['generateMessage'],
			},
		},
		description: 'The message to sign',
	},
	// Animated frames
	{
		displayName: 'Frames (JSON Array)',
		name: 'frames',
		type: 'string',
		default: '[]',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['qrCode'],
				operation: ['mergeFrames'],
			},
		},
		description: 'JSON array of animated QR frames',
	},
	// QR Options
	{
		displayName: 'Options',
		name: 'qrOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['qrCode'],
				operation: ['generate', 'generateTransaction', 'generateMessage', 'generateAnimated'],
			},
		},
		options: [
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 300,
				description: 'QR code size in pixels',
			},
			{
				displayName: 'Error Correction',
				name: 'errorCorrection',
				type: 'options',
				options: [
					{ name: 'Low (7%)', value: 'L' },
					{ name: 'Medium (15%)', value: 'M' },
					{ name: 'Quartile (25%)', value: 'Q' },
					{ name: 'High (30%)', value: 'H' },
				],
				default: 'M',
				description: 'Error correction level',
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				options: [
					{ name: 'Data URL', value: 'dataUrl' },
					{ name: 'SVG', value: 'svg' },
					{ name: 'PNG (Base64)', value: 'base64' },
				],
				default: 'dataUrl',
				description: 'Output format',
			},
			{
				displayName: 'Dark Color',
				name: 'darkColor',
				type: 'color',
				default: '#000000',
				description: 'Dark module color',
			},
			{
				displayName: 'Light Color',
				name: 'lightColor',
				type: 'color',
				default: '#FFFFFF',
				description: 'Light module color',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	let result: IDataObject = {};

	switch (operation) {
		case 'generate': {
			const qrData = this.getNodeParameter('qrData', index) as string;
			const options = this.getNodeParameter('qrOptions', index, {}) as Record<string, unknown>;

			const qrResult = await qrHandler.generateStatic(qrData, {
				width: (options.size as number) || 300,
				errorCorrectionLevel: (options.errorCorrection as 'L' | 'M' | 'Q' | 'H') || 'M',
			});

			result = {
				success: qrResult.success,
				type: qrResult.type,
				qrCode: qrResult.data,
				format: (options.format as string) || 'dataUrl',
				dataLength: qrData.length,
			};
			break;
		}

		case 'generateTransaction': {
			const chain = this.getNodeParameter('chain', index) as string;
			const transactionData = this.getNodeParameter('transactionData', index) as string;
			const options = this.getNodeParameter('qrOptions', index, {}) as Record<string, unknown>;

			const qrResult = await qrHandler.generateTransactionQr(chain, transactionData, {
				width: (options.size as number) || 300,
				errorCorrectionLevel: (options.errorCorrection as 'L' | 'M' | 'Q' | 'H') || 'M',
			});

			result = {
				success: qrResult.success,
				type: qrResult.type,
				qrCode: qrResult.data,
				frameCount: qrResult.frameCount,
				chain,
				isAnimated: qrResult.type === 'animated',
			};
			break;
		}

		case 'generateMessage': {
			const chain = this.getNodeParameter('chain', index) as string;
			const message = this.getNodeParameter('message', index) as string;
			const options = this.getNodeParameter('qrOptions', index, {}) as Record<string, unknown>;

			const qrResult = await qrHandler.generateMessageQr(chain, message, {
				width: (options.size as number) || 300,
				errorCorrectionLevel: (options.errorCorrection as 'L' | 'M' | 'Q' | 'H') || 'M',
			});

			result = {
				success: qrResult.success,
				type: qrResult.type,
				qrCode: qrResult.data,
				chain,
				messageLength: message.length,
			};
			break;
		}

		case 'parse': {
			const qrData = this.getNodeParameter('qrData', index) as string;
			const parseResult = qrHandler.parseQrData(qrData);

			result = {
				success: parseResult.success,
				data: parseResult.data,
				error: parseResult.error,
			};
			break;
		}

		case 'parseSignature': {
			const qrData = this.getNodeParameter('qrData', index) as string;
			const sigResult = qrHandler.parseSignatureQr(qrData);

			result = {
				success: sigResult.success,
				signature: sigResult.signature,
				chain: sigResult.chain,
				error: sigResult.error,
			};
			break;
		}

		case 'generateAnimated': {
			const qrData = this.getNodeParameter('qrData', index) as string;
			const options = this.getNodeParameter('qrOptions', index, {}) as Record<string, unknown>;

			const qrResult = await qrHandler.generateAnimated(qrData, {
				width: (options.size as number) || 300,
				errorCorrectionLevel: (options.errorCorrection as 'L' | 'M' | 'Q' | 'H') || 'M',
			});

			result = {
				success: qrResult.success,
				type: 'animated',
				frames: qrResult.data,
				frameCount: qrResult.frameCount,
				totalDataLength: qrData.length,
			};
			break;
		}

		case 'mergeFrames': {
			const framesJson = this.getNodeParameter('frames', index) as string;
			
			try {
				const frames = JSON.parse(framesJson);
				const mergedData = qrHandler.mergeFrames(frames);

				result = {
					success: true,
					data: mergedData,
					frameCount: frames.length,
					dataLength: mergedData.length,
				};
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid frames JSON', { itemIndex: index });
			}
			break;
		}

		case 'validate': {
			const qrData = this.getNodeParameter('qrData', index) as string;
			const validation = qrHandler.validate(qrData);

			result = {
				valid: validation.valid,
				error: validation.error,
				needsAnimated: qrHandler.needsAnimatedQr(qrData),
				estimatedFrames: qrHandler.getEstimatedFrameCount(qrData.length),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: index });
	}

	return [{ json: result }];
}
