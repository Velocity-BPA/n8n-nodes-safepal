/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal Device Constants
 *
 * Configurations for SafePal hardware wallet models and their capabilities.
 */

export interface DeviceCapabilities {
  qrCode: boolean;
  bluetooth: boolean;
  nfc: boolean;
  usb: boolean;
  battery: boolean;
  screen: boolean;
  airGapped: boolean;
  secureElement: boolean;
}

export interface DeviceModel {
  id: string;
  name: string;
  description: string;
  connectionMethods: ('qr' | 'bluetooth')[];
  capabilities: DeviceCapabilities;
  secureElementLevel: string;
  supportedChains: number;
  firmwareVersion?: string;
}

/**
 * SafePal device models
 */
export const DEVICE_MODELS: Record<string, DeviceModel> = {
  s1: {
    id: 's1',
    name: 'SafePal S1',
    description: 'Air-gapped hardware wallet with QR code communication',
    connectionMethods: ['qr'],
    capabilities: {
      qrCode: true,
      bluetooth: false,
      nfc: false,
      usb: false,
      battery: true,
      screen: true,
      airGapped: true,
      secureElement: true,
    },
    secureElementLevel: 'EAL5+',
    supportedChains: 54,
  },
  s1Pro: {
    id: 's1Pro',
    name: 'SafePal S1 Pro',
    description: 'Enhanced air-gapped hardware wallet with larger screen',
    connectionMethods: ['qr'],
    capabilities: {
      qrCode: true,
      bluetooth: false,
      nfc: false,
      usb: false,
      battery: true,
      screen: true,
      airGapped: true,
      secureElement: true,
    },
    secureElementLevel: 'EAL5+',
    supportedChains: 54,
  },
  x1: {
    id: 'x1',
    name: 'SafePal X1',
    description: 'Hardware wallet with Bluetooth and QR code support',
    connectionMethods: ['qr', 'bluetooth'],
    capabilities: {
      qrCode: true,
      bluetooth: true,
      nfc: false,
      usb: false,
      battery: true,
      screen: true,
      airGapped: false,
      secureElement: true,
    },
    secureElementLevel: 'EAL5+',
    supportedChains: 54,
  },
  cypher: {
    id: 'cypher',
    name: 'SafePal Cypher',
    description: 'Metal seed phrase backup solution',
    connectionMethods: [],
    capabilities: {
      qrCode: false,
      bluetooth: false,
      nfc: false,
      usb: false,
      battery: false,
      screen: false,
      airGapped: true,
      secureElement: false,
    },
    secureElementLevel: 'N/A',
    supportedChains: 0,
  },
};

/**
 * Connection methods
 */
export const CONNECTION_METHODS = {
  QR: 'qr',
  BLUETOOTH: 'bluetooth',
} as const;

export type ConnectionMethod = (typeof CONNECTION_METHODS)[keyof typeof CONNECTION_METHODS];

/**
 * Device model options for n8n dropdowns
 */
export const DEVICE_MODEL_OPTIONS = [
  { name: 'SafePal S1', value: 's1' },
  { name: 'SafePal S1 Pro', value: 's1Pro' },
  { name: 'SafePal X1', value: 'x1' },
  { name: 'SafePal Cypher', value: 'cypher' },
];

/**
 * Connection method options for n8n dropdowns
 */
export const CONNECTION_METHOD_OPTIONS = [
  { name: 'QR Code', value: 'qr' },
  { name: 'Bluetooth', value: 'bluetooth' },
];

/**
 * Device status codes
 */
export const DEVICE_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  SCANNING: 'scanning',
  PAIRING: 'pairing',
  PAIRED: 'paired',
  ERROR: 'error',
} as const;

export type DeviceStatus = (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS];

/**
 * Bluetooth service UUIDs for X1
 */
export const BLUETOOTH_UUIDS = {
  SERVICE_UUID: '0000fff0-0000-1000-8000-00805f9b34fb',
  WRITE_CHARACTERISTIC: '0000fff1-0000-1000-8000-00805f9b34fb',
  NOTIFY_CHARACTERISTIC: '0000fff2-0000-1000-8000-00805f9b34fb',
} as const;

/**
 * Security levels
 */
export const SECURITY_LEVELS = {
  EAL5_PLUS: 'EAL5+',
  EAL6_PLUS: 'EAL6+',
} as const;

/**
 * Get device model by ID
 */
export function getDeviceModel(modelId: string): DeviceModel | undefined {
  return DEVICE_MODELS[modelId];
}

/**
 * Check if device supports Bluetooth
 */
export function supportsBluetooth(modelId: string): boolean {
  const model = DEVICE_MODELS[modelId];
  return model?.capabilities.bluetooth ?? false;
}

/**
 * Check if device is air-gapped
 */
export function isAirGapped(modelId: string): boolean {
  const model = DEVICE_MODELS[modelId];
  return model?.capabilities.airGapped ?? false;
}

/**
 * Get supported connection methods for a device
 */
export function getConnectionMethods(modelId: string): string[] {
  const model = DEVICE_MODELS[modelId];
  return model?.connectionMethods ?? [];
}
