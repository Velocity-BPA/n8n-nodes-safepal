/**
 * @file Transport Layer Index
 * @description Exports all transport handlers for SafePal communication
 * @module n8n-nodes-safepal/transport
 *
 * SPDX-License-Identifier: BSL-1.1
 * Copyright (c) 2025 Velocity Business Partners LLC
 * Business Source License 1.1 - See LICENSE file for details
 * Licensed work: n8n-nodes-safepal
 * Change Date: 2029-01-01
 * Change License: GPL-3.0-or-later
 */

// QR Code Handler
export {
	QrHandler,
	createQrHandler,
	defaultQrHandler,
	type QrHandlerConfig,
	type QrGenerationResult,
	type QrParseResult,
} from './qrHandler';

// Animated QR Handler
export {
	AnimatedQrHandler,
	createAnimatedQrHandler,
	defaultAnimatedQrHandler,
	type AnimatedQrConfig,
	type AnimatedFrame,
	type AnimatedQrSequence,
	type FrameScanResult,
	type AssemblyStatus,
} from './animatedQr';

// Bluetooth Handler
export {
	BluetoothHandler,
	createBluetoothHandler,
	defaultBluetoothHandler,
	type BluetoothHandlerConfig,
	type BluetoothScanResult,
	type BluetoothCommandResult,
	type AddressRequest,
	type AddressResponse,
	type SignTransactionRequest,
	type SignTransactionResponse,
	type SignMessageRequest,
	type SignMessageResponse,
	type DeviceInfoResponse,
	type BluetoothEventType,
	type BluetoothEventHandler,
} from './bluetoothHandler';

// WalletConnect Handler
export {
	WalletConnectHandler,
	createWalletConnectHandler,
	defaultWalletConnectHandler,
	EVM_METHODS,
	EVM_EVENTS,
	type WalletConnectConfig,
	type WalletConnectMetadata,
	type WalletConnectSession,
	type WalletConnectNamespace,
	type ConnectionRequest,
	type SessionRequest,
	type RequestResult,
	type PairingInfo,
	type WalletConnectEventType,
	type WalletConnectEventHandler,
} from './walletConnectHandler';
