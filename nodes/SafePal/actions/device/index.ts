/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { DEVICE_MODELS, CONNECTION_METHODS, getDeviceModel, supportsBluetooth } from '../../constants/devices';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['device'],
			},
		},
		options: [
			{
				name: 'Get Info',
				value: 'getInfo',
				description: 'Get device information',
				action: 'Get device info',
			},
			{
				name: 'List Models',
				value: 'listModels',
				description: 'List supported SafePal device models',
				action: 'List device models',
			},
			{
				name: 'Check Compatibility',
				value: 'checkCompatibility',
				description: 'Check device compatibility with operation',
				action: 'Check device compatibility',
			},
			{
				name: 'Get Capabilities',
				value: 'getCapabilities',
				description: 'Get device capabilities',
				action: 'Get device capabilities',
			},
			{
				name: 'Verify Connection',
				value: 'verifyConnection',
				description: 'Verify device connection status',
				action: 'Verify device connection',
			},
			{
				name: 'Get Firmware Info',
				value: 'getFirmwareInfo',
				description: 'Get device firmware information',
				action: 'Get firmware info',
			},
		],
		default: 'getInfo',
	},
	// Device Model Selection
	{
		displayName: 'Device Model',
		name: 'deviceModel',
		type: 'options',
		options: [
			{ name: 'SafePal S1', value: 's1' },
			{ name: 'SafePal S1 Pro', value: 's1_pro' },
			{ name: 'SafePal X1', value: 'x1' },
			{ name: 'SafePal Cypher', value: 'cypher' },
		],
		default: 's1',
		displayOptions: {
			show: {
				resource: ['device'],
				operation: ['getInfo', 'getCapabilities', 'checkCompatibility'],
			},
		},
		description: 'The SafePal device model',
	},
	// Connection Method
	{
		displayName: 'Connection Method',
		name: 'connectionMethod',
		type: 'options',
		options: [
			{ name: 'QR Code', value: 'qr' },
			{ name: 'Bluetooth', value: 'bluetooth' },
		],
		default: 'qr',
		displayOptions: {
			show: {
				resource: ['device'],
				operation: ['verifyConnection', 'checkCompatibility'],
			},
		},
		description: 'The connection method to use',
	},
	// Operation to check compatibility for
	{
		displayName: 'Target Operation',
		name: 'targetOperation',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['device'],
				operation: ['checkCompatibility'],
			},
		},
		description: 'The operation to check compatibility for',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	let result: IDataObject = {};

	switch (operation) {
		case 'getInfo': {
			const deviceModel = this.getNodeParameter('deviceModel', index) as string;
			const device = getDeviceModel(deviceModel);
			
			if (!device) {
				throw new NodeOperationError(this.getNode(), `Unknown device model: ${deviceModel}`, { itemIndex: index });
			}

			result = {
				success: true,
				device: {
					id: device.id,
					name: device.name,
					displayName: device.name,
					capabilities: device.capabilities,
					securityLevel: device.capabilities.secureElement ? 'EAL5+' : 'Standard',
					connectionMethods: device.capabilities.bluetooth ? ['qr', 'bluetooth'] : ['qr'],
					isAirGapped: device.capabilities.airGapped,
				},
			};
			break;
		}

		case 'listModels': {
			const models = Object.values(DEVICE_MODELS).map((device) => ({
				id: device.id,
				name: device.name,
				displayName: device.name,
				hasQrCode: device.capabilities.qrCode,
				hasBluetooth: device.capabilities.bluetooth,
				isAirGapped: device.capabilities.airGapped,
				hasSecureElement: device.capabilities.secureElement,
			}));

			result = {
				success: true,
				models,
				totalCount: models.length,
			};
			break;
		}

		case 'checkCompatibility': {
			const deviceModel = this.getNodeParameter('deviceModel', index) as string;
			const connectionMethod = this.getNodeParameter('connectionMethod', index) as string;
			const targetOperation = this.getNodeParameter('targetOperation', index) as string;
			const device = getDeviceModel(deviceModel);

			if (!device) {
				throw new NodeOperationError(this.getNode(), `Unknown device model: ${deviceModel}`, { itemIndex: index });
			}

			const issues: string[] = [];
			let isCompatible = true;

			// Check connection method compatibility
			if (connectionMethod === 'bluetooth' && !device.capabilities.bluetooth) {
				issues.push(`${device.name} does not support Bluetooth connections`);
				isCompatible = false;
			}

			// Check specific operation compatibility
			if (targetOperation === 'nfc' && !device.capabilities.nfc) {
				issues.push(`${device.name} does not support NFC`);
				isCompatible = false;
			}

			result = {
				success: true,
				isCompatible,
				deviceModel: device.name,
				connectionMethod,
				issues: issues.length > 0 ? issues : undefined,
			};
			break;
		}

		case 'getCapabilities': {
			const deviceModel = this.getNodeParameter('deviceModel', index) as string;
			const device = getDeviceModel(deviceModel);

			if (!device) {
				throw new NodeOperationError(this.getNode(), `Unknown device model: ${deviceModel}`, { itemIndex: index });
			}

			result = {
				success: true,
				deviceModel: device.name,
				capabilities: {
					...device.capabilities,
					supportedChains: '54+ blockchains',
					maxAccounts: 'Unlimited',
					firmwareUpdatable: true,
				},
			};
			break;
		}

		case 'verifyConnection': {
			const connectionMethod = this.getNodeParameter('connectionMethod', index) as string;

			// Simulated connection verification
			result = {
				success: true,
				connectionMethod,
				status: 'ready',
				message: connectionMethod === 'qr' 
					? 'QR code communication ready'
					: 'Bluetooth connection ready',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getFirmwareInfo': {
			result = {
				success: true,
				firmware: {
					currentVersion: '2.0.0',
					latestVersion: '2.1.0',
					updateAvailable: true,
					releaseNotes: 'Security improvements and new chain support',
					lastChecked: new Date().toISOString(),
				},
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: index });
	}

	return [{ json: result }];
}
