/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal Event Constants
 *
 * Event types for SafePal trigger node and event handling.
 */

/**
 * Event categories
 */
export const EVENT_CATEGORIES = {
  QR: 'qr',
  BLUETOOTH: 'bluetooth',
  TRANSACTION: 'transaction',
  ACCOUNT: 'account',
  DAPP: 'dapp',
  WALLETCONNECT: 'walletConnect',
  DEVICE: 'device',
} as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];

/**
 * QR-related events
 */
export const QR_EVENTS = {
  QR_SCANNED: 'qr.scanned',
  QR_GENERATED: 'qr.generated',
  QR_ANIMATED_COMPLETE: 'qr.animatedComplete',
  QR_SIGNATURE_READY: 'qr.signatureReady',
  QR_PARSE_ERROR: 'qr.parseError',
  QR_VALIDATION_ERROR: 'qr.validationError',
} as const;

export type QrEvent = (typeof QR_EVENTS)[keyof typeof QR_EVENTS];

/**
 * Bluetooth-related events (X1 only)
 */
export const BLUETOOTH_EVENTS = {
  DEVICE_CONNECTED: 'bluetooth.deviceConnected',
  DEVICE_DISCONNECTED: 'bluetooth.deviceDisconnected',
  DATA_RECEIVED: 'bluetooth.dataReceived',
  DATA_SENT: 'bluetooth.dataSent',
  CONNECTION_ERROR: 'bluetooth.connectionError',
  PAIRING_REQUESTED: 'bluetooth.pairingRequested',
  PAIRING_COMPLETE: 'bluetooth.pairingComplete',
  SIGNAL_STRENGTH_CHANGED: 'bluetooth.signalStrengthChanged',
} as const;

export type BluetoothEvent = (typeof BLUETOOTH_EVENTS)[keyof typeof BLUETOOTH_EVENTS];

/**
 * Transaction-related events
 */
export const TRANSACTION_EVENTS = {
  TX_CREATED: 'transaction.created',
  TX_SIGNED: 'transaction.signed',
  TX_BROADCAST: 'transaction.broadcast',
  TX_CONFIRMED: 'transaction.confirmed',
  TX_FAILED: 'transaction.failed',
  TX_PENDING: 'transaction.pending',
  TX_CANCELLED: 'transaction.cancelled',
} as const;

export type TransactionEvent = (typeof TRANSACTION_EVENTS)[keyof typeof TRANSACTION_EVENTS];

/**
 * Account-related events
 */
export const ACCOUNT_EVENTS = {
  ACCOUNT_IMPORTED: 'account.imported',
  ACCOUNT_SYNCED: 'account.synced',
  BALANCE_CHANGED: 'account.balanceChanged',
  TOKEN_RECEIVED: 'account.tokenReceived',
  NFT_RECEIVED: 'account.nftReceived',
  ADDRESS_GENERATED: 'account.addressGenerated',
} as const;

export type AccountEvent = (typeof ACCOUNT_EVENTS)[keyof typeof ACCOUNT_EVENTS];

/**
 * DApp-related events
 */
export const DAPP_EVENTS = {
  DAPP_CONNECTED: 'dapp.connected',
  DAPP_DISCONNECTED: 'dapp.disconnected',
  SIGN_REQUEST: 'dapp.signRequest',
  REQUEST_APPROVED: 'dapp.requestApproved',
  REQUEST_REJECTED: 'dapp.requestRejected',
} as const;

export type DappEvent = (typeof DAPP_EVENTS)[keyof typeof DAPP_EVENTS];

/**
 * WalletConnect-related events
 */
export const WALLETCONNECT_EVENTS = {
  SESSION_PROPOSED: 'walletConnect.sessionProposed',
  SESSION_CONNECTED: 'walletConnect.sessionConnected',
  SESSION_DISCONNECTED: 'walletConnect.sessionDisconnected',
  REQUEST_RECEIVED: 'walletConnect.requestReceived',
  REQUEST_APPROVED: 'walletConnect.requestApproved',
  REQUEST_REJECTED: 'walletConnect.requestRejected',
} as const;

export type WalletConnectEvent =
  (typeof WALLETCONNECT_EVENTS)[keyof typeof WALLETCONNECT_EVENTS];

/**
 * Device-related events
 */
export const DEVICE_EVENTS = {
  DEVICE_READY: 'device.ready',
  DEVICE_LOCKED: 'device.locked',
  DEVICE_UNLOCKED: 'device.unlocked',
  FIRMWARE_UPDATE_AVAILABLE: 'device.firmwareUpdateAvailable',
  BATTERY_LOW: 'device.batteryLow',
  SECURITY_ALERT: 'device.securityAlert',
} as const;

export type DeviceEvent = (typeof DEVICE_EVENTS)[keyof typeof DEVICE_EVENTS];

/**
 * All events combined
 */
export const ALL_EVENTS = {
  ...QR_EVENTS,
  ...BLUETOOTH_EVENTS,
  ...TRANSACTION_EVENTS,
  ...ACCOUNT_EVENTS,
  ...DAPP_EVENTS,
  ...WALLETCONNECT_EVENTS,
  ...DEVICE_EVENTS,
} as const;

export type SafePalEvent = (typeof ALL_EVENTS)[keyof typeof ALL_EVENTS];

/**
 * Event category options for n8n dropdowns
 */
export const EVENT_CATEGORY_OPTIONS = [
  { name: 'QR Code Events', value: 'qr' },
  { name: 'Bluetooth Events (X1)', value: 'bluetooth' },
  { name: 'Transaction Events', value: 'transaction' },
  { name: 'Account Events', value: 'account' },
  { name: 'DApp Events', value: 'dapp' },
  { name: 'WalletConnect Events', value: 'walletConnect' },
  { name: 'Device Events', value: 'device' },
];

/**
 * Event options organized by category
 */
export const EVENT_OPTIONS_BY_CATEGORY: Record<string, Array<{ name: string; value: string }>> = {
  qr: [
    { name: 'QR Code Scanned', value: 'qr.scanned' },
    { name: 'QR Code Generated', value: 'qr.generated' },
    { name: 'Animated QR Complete', value: 'qr.animatedComplete' },
    { name: 'Signature Ready', value: 'qr.signatureReady' },
    { name: 'QR Parse Error', value: 'qr.parseError' },
    { name: 'QR Validation Error', value: 'qr.validationError' },
  ],
  bluetooth: [
    { name: 'Device Connected', value: 'bluetooth.deviceConnected' },
    { name: 'Device Disconnected', value: 'bluetooth.deviceDisconnected' },
    { name: 'Data Received', value: 'bluetooth.dataReceived' },
    { name: 'Data Sent', value: 'bluetooth.dataSent' },
    { name: 'Connection Error', value: 'bluetooth.connectionError' },
    { name: 'Pairing Requested', value: 'bluetooth.pairingRequested' },
    { name: 'Pairing Complete', value: 'bluetooth.pairingComplete' },
  ],
  transaction: [
    { name: 'Transaction Created', value: 'transaction.created' },
    { name: 'Transaction Signed', value: 'transaction.signed' },
    { name: 'Transaction Broadcast', value: 'transaction.broadcast' },
    { name: 'Transaction Confirmed', value: 'transaction.confirmed' },
    { name: 'Transaction Failed', value: 'transaction.failed' },
    { name: 'Transaction Pending', value: 'transaction.pending' },
  ],
  account: [
    { name: 'Account Imported', value: 'account.imported' },
    { name: 'Account Synced', value: 'account.synced' },
    { name: 'Balance Changed', value: 'account.balanceChanged' },
    { name: 'Token Received', value: 'account.tokenReceived' },
    { name: 'NFT Received', value: 'account.nftReceived' },
  ],
  dapp: [
    { name: 'DApp Connected', value: 'dapp.connected' },
    { name: 'DApp Disconnected', value: 'dapp.disconnected' },
    { name: 'Sign Request', value: 'dapp.signRequest' },
    { name: 'Request Approved', value: 'dapp.requestApproved' },
    { name: 'Request Rejected', value: 'dapp.requestRejected' },
  ],
  walletConnect: [
    { name: 'Session Proposed', value: 'walletConnect.sessionProposed' },
    { name: 'Session Connected', value: 'walletConnect.sessionConnected' },
    { name: 'Session Disconnected', value: 'walletConnect.sessionDisconnected' },
    { name: 'Request Received', value: 'walletConnect.requestReceived' },
  ],
  device: [
    { name: 'Device Ready', value: 'device.ready' },
    { name: 'Device Locked', value: 'device.locked' },
    { name: 'Device Unlocked', value: 'device.unlocked' },
    { name: 'Firmware Update Available', value: 'device.firmwareUpdateAvailable' },
    { name: 'Battery Low', value: 'device.batteryLow' },
    { name: 'Security Alert', value: 'device.securityAlert' },
  ],
};

/**
 * Get events for a category
 */
export function getEventsForCategory(
  category: EventCategory,
): Array<{ name: string; value: string }> {
  return EVENT_OPTIONS_BY_CATEGORY[category] ?? [];
}

/**
 * Event payload interfaces
 */
export interface QrEventPayload {
  type: QrEvent;
  data: string;
  format?: string;
  timestamp: number;
  frameIndex?: number;
  totalFrames?: number;
}

export interface BluetoothEventPayload {
  type: BluetoothEvent;
  deviceId: string;
  deviceName?: string;
  data?: string;
  signalStrength?: number;
  timestamp: number;
}

export interface TransactionEventPayload {
  type: TransactionEvent;
  txHash?: string;
  chain: string;
  from: string;
  to: string;
  value: string;
  status: string;
  timestamp: number;
}

export interface AccountEventPayload {
  type: AccountEvent;
  address: string;
  chain: string;
  balance?: string;
  tokenAddress?: string;
  tokenId?: string;
  timestamp: number;
}

export interface DappEventPayload {
  type: DappEvent;
  dappUrl: string;
  dappName?: string;
  requestId?: string;
  method?: string;
  timestamp: number;
}

export interface WalletConnectEventPayload {
  type: WalletConnectEvent;
  sessionId: string;
  peerId?: string;
  peerMeta?: {
    name: string;
    url: string;
    description?: string;
    icons?: string[];
  };
  request?: {
    id: number;
    method: string;
    params: unknown[];
  };
  timestamp: number;
}

export interface DeviceEventPayload {
  type: DeviceEvent;
  deviceId: string;
  deviceModel: string;
  firmwareVersion?: string;
  batteryLevel?: number;
  message?: string;
  timestamp: number;
}

export type EventPayload =
  | QrEventPayload
  | BluetoothEventPayload
  | TransactionEventPayload
  | AccountEventPayload
  | DappEventPayload
  | WalletConnectEventPayload
  | DeviceEventPayload;
