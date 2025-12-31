/**
 * @file Bluetooth Transport Handler for SafePal X1
 * @description Handles Bluetooth communication with SafePal X1 hardware wallet
 * @module n8n-nodes-safepal/transport/bluetoothHandler
 *
 * SPDX-License-Identifier: BSL-1.1
 * Copyright (c) 2025 Velocity Business Partners LLC
 * Business Source License 1.1 - See LICENSE file for details
 * Licensed work: n8n-nodes-safepal
 * Change Date: 2029-01-01
 * Change License: GPL-3.0-or-later
 */

import {
	BluetoothDeviceInfo,
	BluetoothMessage,
	BLUETOOTH_COMMANDS,
	createBluetoothMessage,
	chunkDataForBluetooth,
	rssiToPercentage,
	getSignalStrengthDescription,
	BluetoothSimulator,
} from '../utils/bluetoothUtils';
import { BLUETOOTH_UUIDS } from '../constants/devices';
import { getChainConfig } from '../constants/chains';

/**
 * Bluetooth handler configuration
 */
export interface BluetoothHandlerConfig {
	/** Connection timeout in milliseconds */
	connectionTimeout: number;
	/** Command response timeout in milliseconds */
	commandTimeout: number;
	/** Auto-reconnect on disconnect */
	autoReconnect: boolean;
	/** Maximum reconnect attempts */
	maxReconnectAttempts: number;
	/** Reconnect delay in milliseconds */
	reconnectDelay: number;
	/** Enable simulation mode for development */
	simulationMode: boolean;
	/** Scan duration in milliseconds */
	scanDuration: number;
}

/**
 * Bluetooth scan result
 */
export interface BluetoothScanResult {
	devices: BluetoothDeviceInfo[];
	scanDuration: number;
	timestamp: string;
}

/**
 * Bluetooth command result
 */
export interface BluetoothCommandResult {
	success: boolean;
	command: string;
	response?: BluetoothMessage;
	error?: string;
	duration: number;
}

/**
 * Address request parameters
 */
export interface AddressRequest {
	chainId: string;
	accountIndex?: number;
	addressIndex?: number;
	showOnDevice?: boolean;
}

/**
 * Address response
 */
export interface AddressResponse {
	chainId: string;
	address: string;
	derivationPath: string;
	publicKey?: string;
}

/**
 * Sign transaction request
 */
export interface SignTransactionRequest {
	chainId: string;
	unsignedTransaction: string;
	derivationPath?: string;
}

/**
 * Sign transaction response
 */
export interface SignTransactionResponse {
	chainId: string;
	signedTransaction: string;
	signature: string;
	txHash?: string;
}

/**
 * Sign message request
 */
export interface SignMessageRequest {
	chainId: string;
	message: string;
	messageType: 'personal' | 'typed_data' | 'raw';
	derivationPath?: string;
}

/**
 * Sign message response
 */
export interface SignMessageResponse {
	chainId: string;
	signature: string;
	recoveryParam?: number;
}

/**
 * Device info response
 */
export interface DeviceInfoResponse {
	model: string;
	firmwareVersion: string;
	serialNumber: string;
	batteryLevel: number;
	isLocked: boolean;
	supportedChains: string[];
}

/**
 * Bluetooth event types
 */
export type BluetoothEventType =
	| 'connected'
	| 'disconnected'
	| 'connectionError'
	| 'commandSent'
	| 'responseReceived'
	| 'scanStarted'
	| 'scanCompleted'
	| 'deviceFound'
	| 'reconnecting';

/**
 * Bluetooth event handler
 */
export type BluetoothEventHandler = (event: BluetoothEventType, data: unknown) => void;

/**
 * Connection status type (simplified for internal use)
 */
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * Bluetooth Handler Class
 * Manages Bluetooth communication with SafePal X1 devices
 */
export class BluetoothHandler {
	private config: BluetoothHandlerConfig;
	private connectionState: ConnectionStatus;
	private connectedDevice: BluetoothDeviceInfo | null;
	private eventHandlers: BluetoothEventHandler[];
	private simulator: BluetoothSimulator | null;
	private reconnectAttempts: number;
	private pendingCommands: Map<string, {
		resolve: (value: BluetoothMessage) => void;
		reject: (error: Error) => void;
		timeout: NodeJS.Timeout;
	}>;

	constructor(config: Partial<BluetoothHandlerConfig> = {}) {
		this.config = {
			connectionTimeout: 30000,
			commandTimeout: 60000,
			autoReconnect: true,
			maxReconnectAttempts: 3,
			reconnectDelay: 2000,
			simulationMode: false,
			scanDuration: 10000,
			...config,
		};

		this.connectionState = 'disconnected';
		this.connectedDevice = null;
		this.eventHandlers = [];
		this.simulator = null;
		this.reconnectAttempts = 0;
		this.pendingCommands = new Map();

		if (this.config.simulationMode) {
			this.simulator = new BluetoothSimulator();
		}
	}

	/**
	 * Get current connection state
	 */
	getConnectionState(): ConnectionStatus {
		return this.connectionState;
	}

	/**
	 * Get connected device info
	 */
	getConnectedDevice(): BluetoothDeviceInfo | null {
		return this.connectedDevice;
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.connectionState === 'connected';
	}

	/**
	 * Add event handler
	 */
	addEventListener(handler: BluetoothEventHandler): void {
		this.eventHandlers.push(handler);
	}

	/**
	 * Remove event handler
	 */
	removeEventListener(handler: BluetoothEventHandler): void {
		const index = this.eventHandlers.indexOf(handler);
		if (index !== -1) {
			this.eventHandlers.splice(index, 1);
		}
	}

	/**
	 * Emit event to all handlers
	 */
	private emitEvent(event: BluetoothEventType, data: unknown): void {
		for (const handler of this.eventHandlers) {
			try {
				handler(event, data);
			} catch (error) {
				console.error('Error in Bluetooth event handler:', error);
			}
		}
	}

	/**
	 * Update connection state
	 */
	private setConnectionState(state: ConnectionStatus): void {
		this.connectionState = state;
	}

	/**
	 * Scan for SafePal devices
	 */
	async scan(): Promise<BluetoothScanResult> {
		const startTime = Date.now();
		this.emitEvent('scanStarted', { timestamp: new Date().toISOString() });

		if (this.config.simulationMode && this.simulator) {
			// Simulated scan
			await this.delay(1000);
			const simulatedDevices: BluetoothDeviceInfo[] = [
				{
					id: 'sim-x1-001',
					name: 'SafePal X1',
					rssi: -45,
					connected: false,
					paired: false,
					services: [BLUETOOTH_UUIDS.SERVICE_UUID],
				},
				{
					id: 'sim-x1-002',
					name: 'SafePal X1 Pro',
					rssi: -62,
					connected: false,
					paired: false,
					services: [BLUETOOTH_UUIDS.SERVICE_UUID],
				},
			];

			this.emitEvent('scanCompleted', { devices: simulatedDevices });

			return {
				devices: simulatedDevices,
				scanDuration: Date.now() - startTime,
				timestamp: new Date().toISOString(),
			};
		}

		// Real Bluetooth scan would be implemented here
		// This requires Web Bluetooth API or native Bluetooth bindings
		// For n8n server environment, this would need a Bluetooth bridge service

		const devices: BluetoothDeviceInfo[] = [];

		this.emitEvent('scanCompleted', { devices });

		return {
			devices,
			scanDuration: Date.now() - startTime,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Connect to a SafePal device
	 */
	async connect(deviceId: string): Promise<boolean> {
		if (this.connectionState === 'connected') {
			if (this.connectedDevice?.id === deviceId) {
				return true;
			}
			await this.disconnect();
		}

		this.setConnectionState('connecting');

		try {
			if (this.config.simulationMode && this.simulator) {
				const connected = await this.simulator.connect(deviceId);
				if (connected) {
					this.connectedDevice = {
						id: deviceId,
						name: 'SafePal X1 (Simulated)',
						rssi: -45,
						connected: true,
						paired: true,
						services: [BLUETOOTH_UUIDS.SERVICE_UUID],
					};
					this.setConnectionState('connected');
					this.reconnectAttempts = 0;
					this.emitEvent('connected', { device: this.connectedDevice });
					return true;
				}
			}

			// Real Bluetooth connection would be implemented here
			// Timeout handling
			await this.withTimeout(
				this.performConnection(deviceId),
				this.config.connectionTimeout,
				'Connection timeout',
			);

			this.setConnectionState('connected');
			this.reconnectAttempts = 0;
			this.emitEvent('connected', { device: this.connectedDevice });
			return true;
		} catch (error) {
			this.setConnectionState('disconnected');
			this.emitEvent('connectionError', { error: (error as Error).message });

			if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
				return this.attemptReconnect(deviceId);
			}

			throw error;
		}
	}

	/**
	 * Perform actual connection (placeholder for real implementation)
	 */
	private async performConnection(deviceId: string): Promise<void> {
		// In a real implementation, this would:
		// 1. Discover the device
		// 2. Establish GATT connection
		// 3. Discover services and characteristics
		// 4. Set up notification handlers

		// For now, just simulate connection
		await this.delay(500);

		this.connectedDevice = {
			id: deviceId,
			name: 'SafePal X1',
			rssi: -50,
			connected: true,
			paired: true,
			services: [BLUETOOTH_UUIDS.SERVICE_UUID],
		};
	}

	/**
	 * Attempt reconnection
	 */
	private async attemptReconnect(deviceId: string): Promise<boolean> {
		this.reconnectAttempts++;
		this.emitEvent('reconnecting', {
			attempt: this.reconnectAttempts,
			maxAttempts: this.config.maxReconnectAttempts,
		});

		await this.delay(this.config.reconnectDelay);
		return this.connect(deviceId);
	}

	/**
	 * Disconnect from device
	 */
	async disconnect(): Promise<void> {
		if (this.connectionState === 'disconnected') {
			return;
		}

		// Cancel pending commands
		for (const [commandId, pending] of this.pendingCommands) {
			clearTimeout(pending.timeout);
			pending.reject(new Error('Disconnected'));
			this.pendingCommands.delete(commandId);
		}

		if (this.config.simulationMode && this.simulator) {
			this.simulator.disconnect();
		}

		this.connectedDevice = null;
		this.setConnectionState('disconnected');
		this.emitEvent('disconnected', { timestamp: new Date().toISOString() });
	}

	/**
	 * Send command to device
	 */
	async sendCommand(command: string, payload: Record<string, unknown> = {}): Promise<BluetoothMessage> {
		if (!this.isConnected()) {
			throw new Error('Not connected to device');
		}

		const message = createBluetoothMessage(command, payload);
		const commandId = message.id || `cmd_${Date.now()}`;

		this.emitEvent('commandSent', { command, payload });

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.pendingCommands.delete(commandId);
				reject(new Error(`Command timeout: ${command}`));
			}, this.config.commandTimeout);

			this.pendingCommands.set(commandId, { resolve, reject, timeout });

			// Send the message
			this.sendMessage(message)
				.then(() => {
					// Wait for response (handled by notification)
					if (this.config.simulationMode && this.simulator) {
						// In simulation mode, generate response
						this.simulator.sendCommand(command as keyof typeof BLUETOOTH_COMMANDS, payload).then((response) => {
							if (response) {
								this.handleResponse(response);
							}
						});
					}
				})
				.catch((error) => {
					clearTimeout(timeout);
					this.pendingCommands.delete(commandId);
					reject(error);
				});
		});
	}

	/**
	 * Send raw message to device
	 */
	private async sendMessage(message: BluetoothMessage): Promise<void> {
		const data = JSON.stringify(message);
		const chunks = chunkDataForBluetooth(data);

		for (const chunk of chunks) {
			await this.writeToDevice(chunk);
		}
	}

	/**
	 * Write data to device (placeholder)
	 */
	private async writeToDevice(_data: string): Promise<void> {
		// In real implementation, write to GATT characteristic
		await this.delay(10);
	}

	/**
	 * Handle response from device
	 */
	private handleResponse(response: BluetoothMessage): void {
		this.emitEvent('responseReceived', response);

		// Find matching pending command
		const responseId = response.id || '';
		const pending = this.pendingCommands.get(responseId);
		if (pending) {
			clearTimeout(pending.timeout);
			this.pendingCommands.delete(responseId);

			if (response.type === 'error') {
				const errorMsg = response.payload?.error as string || 'Unknown error';
				pending.reject(new Error(errorMsg));
			} else {
				pending.resolve(response);
			}
		}
	}

	/**
	 * Get device information
	 */
	async getDeviceInfo(): Promise<DeviceInfoResponse> {
		const response = await this.sendCommand(BLUETOOTH_COMMANDS.GET_INFO);
		const payload = response.payload || {};

		return {
			model: (payload.model as string) || 'Unknown',
			firmwareVersion: (payload.firmwareVersion as string) || '0.0.0',
			serialNumber: (payload.serialNumber as string) || '',
			batteryLevel: (payload.batteryLevel as number) || 100,
			isLocked: (payload.isLocked as boolean) || false,
			supportedChains: (payload.supportedChains as string[]) || [],
		};
	}

	/**
	 * Get address from device
	 */
	async getAddress(request: AddressRequest): Promise<AddressResponse> {
		const chainConfig = getChainConfig(request.chainId);
		if (!chainConfig) {
			throw new Error(`Unsupported chain: ${request.chainId}`);
		}

		const response = await this.sendCommand(BLUETOOTH_COMMANDS.GET_ADDRESS, {
			chainId: request.chainId,
			accountIndex: request.accountIndex || 0,
			addressIndex: request.addressIndex || 0,
			showOnDevice: request.showOnDevice || true,
		});
		const payload = response.payload || {};

		return {
			chainId: request.chainId,
			address: (payload.address as string) || '',
			derivationPath: (payload.derivationPath as string) || '',
			publicKey: (payload.publicKey as string) || '',
		};
	}

	/**
	 * Sign transaction on device
	 */
	async signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse> {
		const chainConfig = getChainConfig(request.chainId);
		if (!chainConfig) {
			throw new Error(`Unsupported chain: ${request.chainId}`);
		}

		const response = await this.sendCommand(BLUETOOTH_COMMANDS.SIGN_TX, {
			chainId: request.chainId,
			unsignedTx: request.unsignedTransaction,
			derivationPath: request.derivationPath,
		});
		const payload = response.payload || {};

		return {
			chainId: request.chainId,
			signedTransaction: (payload.signedTx as string) || '',
			signature: (payload.signature as string) || '',
			txHash: (payload.txHash as string) || '',
		};
	}

	/**
	 * Sign message on device
	 */
	async signMessage(request: SignMessageRequest): Promise<SignMessageResponse> {
		const chainConfig = getChainConfig(request.chainId);
		if (!chainConfig) {
			throw new Error(`Unsupported chain: ${request.chainId}`);
		}

		const response = await this.sendCommand(BLUETOOTH_COMMANDS.SIGN_MESSAGE, {
			chainId: request.chainId,
			message: request.message,
			messageType: request.messageType,
			derivationPath: request.derivationPath,
		});
		const payload = response.payload || {};

		return {
			chainId: request.chainId,
			signature: (payload.signature as string) || '',
			recoveryParam: (payload.recoveryParam as number) || 0,
		};
	}

	/**
	 * Ping device to check connectivity
	 */
	async ping(): Promise<boolean> {
		try {
			const response = await this.sendCommand(BLUETOOTH_COMMANDS.PING);
			return response.type === 'response';
		} catch {
			return false;
		}
	}

	/**
	 * Get signal strength of connected device
	 */
	getSignalStrength(): { rssi: number; percentage: number; description: string } | null {
		if (!this.connectedDevice) {
			return null;
		}

		const rssi = this.connectedDevice.rssi ?? -100;
		return {
			rssi,
			percentage: rssiToPercentage(rssi),
			description: getSignalStrengthDescription(rssi),
		};
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<BluetoothHandlerConfig>): void {
		this.config = { ...this.config, ...config };

		if (config.simulationMode !== undefined) {
			if (config.simulationMode && !this.simulator) {
				this.simulator = new BluetoothSimulator();
			} else if (!config.simulationMode) {
				this.simulator = null;
			}
		}
	}

	/**
	 * Get current configuration
	 */
	getConfig(): BluetoothHandlerConfig {
		return { ...this.config };
	}

	/**
	 * Helper to add timeout to promise
	 */
	private async withTimeout<T>(
		promise: Promise<T>,
		timeoutMs: number,
		errorMessage: string,
	): Promise<T> {
		return Promise.race([
			promise,
			new Promise<T>((_, reject) => {
				setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
			}),
		]);
	}

	/**
	 * Helper delay function
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Create a new Bluetooth handler instance
 */
export function createBluetoothHandler(config?: Partial<BluetoothHandlerConfig>): BluetoothHandler {
	return new BluetoothHandler(config);
}

/**
 * Default Bluetooth handler instance (simulation mode for dev)
 */
export const defaultBluetoothHandler = new BluetoothHandler({ simulationMode: true });
