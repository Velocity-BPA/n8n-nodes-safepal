/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal Bluetooth Utilities
 *
 * Functions for Bluetooth communication with SafePal X1 device.
 * Note: Actual Bluetooth communication requires platform-specific implementation.
 */

import { BLUETOOTH_UUIDS, DEVICE_STATUS, type DeviceStatus } from '../constants/devices';

/**
 * Bluetooth device info
 */
export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  rssi?: number;
  services?: string[];
  connected: boolean;
  paired: boolean;
}

/**
 * Bluetooth message structure
 */
export interface BluetoothMessage {
  type: string;
  command: string;
  data: string;
  checksum: string;
  timestamp: number;
  id?: string;
  payload?: {
    // Common fields
    error?: string;
    success?: boolean;
    
    // Device info fields
    model?: string;
    firmwareVersion?: string;
    serialNumber?: string;
    batteryLevel?: number;
    isLocked?: boolean;
    supportedChains?: string[];
    
    // Address fields
    address?: string;
    chain?: string;
    format?: string;
    verified?: boolean;
    displayText?: string;
    derivationPath?: string;
    publicKey?: string;
    
    // Transaction fields
    txData?: string;
    txType?: string;
    txHash?: string;
    signedTx?: string;
    raw?: string;
    
    // Signature fields
    signature?: string;
    v?: number;
    r?: string;
    s?: string;
    recoveryParam?: number;
    
    // Message fields
    message?: string;
    messageHash?: string;
    
    // Value fields
    value?: string;
    valueFormatted?: string;
    result?: string;
    
    // Allow additional fields
    [key: string]: unknown;
  };
}

/**
 * Bluetooth connection state
 */
export interface BluetoothConnectionState {
  deviceId: string | null;
  status: DeviceStatus;
  signalStrength: number;
  lastActivity: number;
  error?: string;
}

/**
 * Create initial Bluetooth connection state
 */
export function createInitialBluetoothState(): BluetoothConnectionState {
  return {
    deviceId: null,
    status: DEVICE_STATUS.DISCONNECTED,
    signalStrength: 0,
    lastActivity: Date.now(),
  };
}

/**
 * Bluetooth command types for SafePal X1
 */
export const BLUETOOTH_COMMANDS = {
  GET_INFO: 'GET_INFO',
  GET_ADDRESS: 'GET_ADDRESS',
  SIGN_TX: 'SIGN_TX',
  SIGN_MESSAGE: 'SIGN_MESSAGE',
  GET_BALANCE: 'GET_BALANCE',
  SYNC_DATA: 'SYNC_DATA',
  PING: 'PING',
  PONG: 'PONG',
} as const;

export type BluetoothCommand = (typeof BLUETOOTH_COMMANDS)[keyof typeof BLUETOOTH_COMMANDS];

/**
 * Create Bluetooth message
 */
export function createBluetoothMessage(
  command: string,
  data: string | Record<string, unknown>,
): BluetoothMessage {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const message: BluetoothMessage = {
    type: 'COMMAND',
    command,
    data: dataStr,
    checksum: calculateMessageChecksum(command + dataStr),
    timestamp: Date.now(),
    id,
  };
  return message;
}

/**
 * Parse Bluetooth message
 */
export function parseBluetoothMessage(rawData: string): BluetoothMessage | null {
  try {
    const message = JSON.parse(rawData) as BluetoothMessage;

    // Validate checksum
    const expectedChecksum = calculateMessageChecksum(message.command + message.data);
    if (message.checksum !== expectedChecksum) {
      console.warn('Bluetooth message checksum mismatch');
      return null;
    }

    return message;
  } catch {
    return null;
  }
}

/**
 * Calculate message checksum
 */
export function calculateMessageChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Serialize message for Bluetooth transmission
 */
export function serializeBluetoothMessage(message: BluetoothMessage): string {
  return JSON.stringify(message);
}

/**
 * Check if device is SafePal X1 by service UUIDs
 */
export function isSafePalDevice(serviceUuids: string[]): boolean {
  return serviceUuids.some(
    (uuid) => uuid.toLowerCase() === BLUETOOTH_UUIDS.SERVICE_UUID.toLowerCase(),
  );
}

/**
 * Convert RSSI to signal strength percentage
 */
export function rssiToPercentage(rssi: number): number {
  // RSSI typically ranges from -100 (weak) to -30 (strong)
  const minRssi = -100;
  const maxRssi = -30;
  const percentage = ((rssi - minRssi) / (maxRssi - minRssi)) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

/**
 * Get signal strength description
 */
export function getSignalStrengthDescription(percentage: number): string {
  if (percentage >= 75) return 'Excellent';
  if (percentage >= 50) return 'Good';
  if (percentage >= 25) return 'Fair';
  return 'Weak';
}

/**
 * Chunk data for Bluetooth transmission
 */
export function chunkDataForBluetooth(data: string, maxChunkSize: number = 512): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += maxChunkSize) {
    chunks.push(data.slice(i, i + maxChunkSize));
  }
  return chunks;
}

/**
 * Merge Bluetooth data chunks
 */
export function mergeBluetoothChunks(chunks: string[]): string {
  return chunks.join('');
}

/**
 * Create device scan filter
 */
export function createScanFilter(): {
  services: string[];
  namePrefix: string;
} {
  return {
    services: [BLUETOOTH_UUIDS.SERVICE_UUID],
    namePrefix: 'SafePal',
  };
}

/**
 * Validate device ID format
 */
export function validateDeviceId(deviceId: string): boolean {
  // Device IDs are typically UUIDs or MAC addresses
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const macPattern = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
  return uuidPattern.test(deviceId) || macPattern.test(deviceId);
}

/**
 * Format device ID for display
 */
export function formatDeviceId(deviceId: string): string {
  if (deviceId.length > 17) {
    return `${deviceId.slice(0, 8)}...${deviceId.slice(-4)}`;
  }
  return deviceId;
}

/**
 * Simulate Bluetooth operations (for testing/development)
 */
export class BluetoothSimulator {
  private connected: boolean = false;
  private deviceId: string | null = null;

  async connect(deviceId: string): Promise<boolean> {
    await this.delay(500);
    this.connected = true;
    this.deviceId = deviceId;
    return true;
  }

  async disconnect(): Promise<boolean> {
    await this.delay(200);
    this.connected = false;
    this.deviceId = null;
    return true;
  }

  async sendCommand(command: BluetoothCommand | string, data: string | Record<string, unknown>): Promise<BluetoothMessage | null> {
    if (!this.connected) {
      return null;
    }

    await this.delay(300);
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    // Simulate response based on command
    const response: BluetoothMessage = {
      type: 'RESPONSE',
      command: typeof command === 'string' ? command : command,
      data: this.getSimulatedResponse(command as BluetoothCommand, dataStr),
      checksum: '',
      timestamp: Date.now(),
    };
    response.checksum = calculateMessageChecksum(response.command + response.data);

    return response;
  }

  private getSimulatedResponse(command: BluetoothCommand, _data: string): string {
    switch (command) {
      case BLUETOOTH_COMMANDS.GET_INFO:
        return JSON.stringify({
          model: 'X1',
          firmware: '1.0.5',
          battery: 85,
        });
      case BLUETOOTH_COMMANDS.PING:
        return 'PONG';
      default:
        return 'OK';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isConnected(): boolean {
    return this.connected;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }
}
