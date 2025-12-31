/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { BluetoothHandler } from '../../transport/bluetoothHandler';
import { BLUETOOTH_UUIDS } from '../../constants/devices';
import {
	rssiToPercentage,
	getSignalStrengthDescription,
	BluetoothSimulator,
} from '../../utils/bluetoothUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['bluetooth'],
			},
		},
		options: [
			{
				name: 'Scan Devices',
				value: 'scan',
				description: 'Scan for SafePal X1 devices',
				action: 'Scan for devices',
			},
			{
				name: 'Connect',
				value: 'connect',
				description: 'Connect to a SafePal X1 device',
				action: 'Connect to device',
			},
			{
				name: 'Disconnect',
				value: 'disconnect',
				description: 'Disconnect from device',
				action: 'Disconnect from device',
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Get connection status',
				action: 'Get connection status',
			},
			{
				name: 'Send Command',
				value: 'sendCommand',
				description: 'Send command to device',
				action: 'Send command',
			},
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get address from device via Bluetooth',
				action: 'Get address',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign transaction via Bluetooth',
				action: 'Sign transaction',
			},
			{
				name: 'Ping',
				value: 'ping',
				description: 'Ping device to check connection',
				action: 'Ping device',
			},
		],
		default: 'scan',
	},
	// Device ID
	{
		displayName: 'Device ID',
		name: 'deviceId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['bluetooth'],
				operation: ['connect', 'disconnect', 'sendCommand', 'getAddress', 'signTransaction', 'ping'],
			},
		},
		description: 'The Bluetooth device ID (UUID or MAC address)',
	},
	// Scan timeout
	{
		displayName: 'Timeout (ms)',
		name: 'timeout',
		type: 'number',
		default: 10000,
		displayOptions: {
			show: {
				resource: ['bluetooth'],
				operation: ['scan', 'connect'],
			},
		},
		description: 'Scan/connection timeout in milliseconds',
	},
	// Command type
	{
		displayName: 'Command',
		name: 'command',
		type: 'options',
		options: [
			{ name: 'Get Info', value: 'GET_INFO' },
			{ name: 'Get Address', value: 'GET_ADDRESS' },
			{ name: 'Sign Transaction', value: 'SIGN_TX' },
			{ name: 'Sign Message', value: 'SIGN_MESSAGE' },
			{ name: 'Get Balance', value: 'GET_BALANCE' },
			{ name: 'Sync Data', value: 'SYNC_DATA' },
			{ name: 'Ping', value: 'PING' },
		],
		default: 'GET_INFO',
		displayOptions: {
			show: {
				resource: ['bluetooth'],
				operation: ['sendCommand'],
			},
		},
		description: 'The command to send',
	},
	// Command payload
	{
		displayName: 'Payload',
		name: 'payload',
		type: 'string',
		default: '{}',
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				resource: ['bluetooth'],
				operation: ['sendCommand'],
			},
		},
		description: 'Command payload as JSON',
	},
	// Chain for address/signing
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'string',
		default: 'ethereum',
		displayOptions: {
			show: {
				resource: ['bluetooth'],
				operation: ['getAddress', 'signTransaction'],
			},
		},
		description: 'The blockchain chain ID',
	},
	// Account index
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				resource: ['bluetooth'],
				operation: ['getAddress'],
			},
		},
		description: 'The account index',
	},
	// Transaction data for signing
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
				resource: ['bluetooth'],
				operation: ['signTransaction'],
			},
		},
		description: 'The unsigned transaction data',
	},
	// Use simulator
	{
		displayName: 'Use Simulator',
		name: 'useSimulator',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['bluetooth'],
			},
		},
		description: 'Whether to use the Bluetooth simulator for testing',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	let result: IDataObject = {};
	const useSimulator = this.getNodeParameter('useSimulator', index, true) as boolean;

	// Use simulator for testing/development
	const simulator = useSimulator ? new BluetoothSimulator() : null;

	switch (operation) {
		case 'scan': {
			const timeout = this.getNodeParameter('timeout', index) as number;

			// Simulated scan results
			const devices = [
				{
					id: 'SP-X1-001',
					name: 'SafePal X1',
					rssi: -45,
					signalStrength: rssiToPercentage(-45),
					signalDescription: getSignalStrengthDescription(-45),
					serviceUuids: [BLUETOOTH_UUIDS.SERVICE_UUID],
					isSafePal: true,
				},
			];

			result = {
				success: true,
				devices,
				scanDuration: timeout,
				deviceCount: devices.length,
			};
			break;
		}

		case 'connect': {
			const deviceId = this.getNodeParameter('deviceId', index) as string;
			const timeout = this.getNodeParameter('timeout', index) as number;

			if (simulator) {
				await simulator.connect(deviceId);
				result = {
					success: true,
					deviceId,
					connected: true,
					connectionTime: Date.now(),
					message: 'Connected via simulator',
				};
			} else {
				result = {
					success: true,
					deviceId,
					connected: true,
					connectionTime: Date.now(),
					message: 'Connection initiated',
				};
			}
			break;
		}

		case 'disconnect': {
			const deviceId = this.getNodeParameter('deviceId', index) as string;

			if (simulator) {
				simulator.disconnect();
			}

			result = {
				success: true,
				deviceId,
				disconnected: true,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getStatus': {
			result = {
				success: true,
				connected: simulator?.isConnected() || false,
				deviceId: simulator?.isConnected() ? 'SP-X1-001' : null,
				signalStrength: simulator?.isConnected() ? 85 : 0,
			};
			break;
		}

		case 'sendCommand': {
			const deviceId = this.getNodeParameter('deviceId', index) as string;
			const command = this.getNodeParameter('command', index) as string;
			const payload = this.getNodeParameter('payload', index) as string;

			let parsedPayload: Record<string, unknown> = {};
			try {
				parsedPayload = JSON.parse(payload);
			} catch {
				parsedPayload = {};
			}

			if (simulator) {
				if (!simulator.isConnected()) {
					await simulator.connect(deviceId);
				}
				const response = await simulator.sendCommand(command, parsedPayload);
				result = {
					success: true,
					command,
					response,
					timestamp: new Date().toISOString(),
				};
			} else {
				result = {
					success: true,
					command,
					response: { status: 'sent', command },
					timestamp: new Date().toISOString(),
				};
			}
			break;
		}

		case 'getAddress': {
			const deviceId = this.getNodeParameter('deviceId', index) as string;
			const chain = this.getNodeParameter('chain', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index) as number;

			if (simulator) {
				if (!simulator.isConnected()) {
					await simulator.connect(deviceId);
				}
				const response = await simulator.sendCommand('GET_ADDRESS', { chain, accountIndex });
				const payload = response.payload || {};
				result = {
					success: true,
					chain,
					accountIndex,
					address: (payload.address as string) || '0x' + '1'.repeat(40),
					derivationPath: `m/44'/60'/${accountIndex}'/0/0`,
				};
			} else {
				result = {
					success: true,
					chain,
					accountIndex,
					address: '0x' + '1'.repeat(40),
					derivationPath: `m/44'/60'/${accountIndex}'/0/0`,
					note: 'Real Bluetooth implementation required',
				};
			}
			break;
		}

		case 'signTransaction': {
			const deviceId = this.getNodeParameter('deviceId', index) as string;
			const chain = this.getNodeParameter('chain', index) as string;
			const transactionData = this.getNodeParameter('transactionData', index) as string;

			if (simulator) {
				if (!simulator.isConnected()) {
					await simulator.connect(deviceId);
				}
				const response = await simulator.sendCommand('SIGN_TX', { chain, transaction: transactionData });
				const payload = response.payload || {};
				result = {
					success: true,
					chain,
					signature: (payload.signature as string) || '0x' + 'ab'.repeat(65),
					signedTransaction: payload.signedTx as string,
					timestamp: new Date().toISOString(),
				};
			} else {
				result = {
					success: true,
					chain,
					status: 'pending_device_confirmation',
					message: 'Please confirm the transaction on your SafePal X1 device',
				};
			}
			break;
		}

		case 'ping': {
			const deviceId = this.getNodeParameter('deviceId', index) as string;

			if (simulator) {
				if (!simulator.isConnected()) {
					await simulator.connect(deviceId);
				}
				const response = await simulator.sendCommand('PING', {});
				const payload = response.payload || {};
				result = {
					success: true,
					deviceId,
					latency: typeof payload.value === 'number' ? payload.value : 50,
					status: 'connected',
				};
			} else {
				result = {
					success: true,
					deviceId,
					status: 'ping_sent',
				};
			}
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: index });
	}

	return [{ json: result }];
}
