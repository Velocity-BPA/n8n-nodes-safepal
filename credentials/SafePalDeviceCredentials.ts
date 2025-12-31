/**
 * @file SafePal Device Credentials
 * @description Credentials for SafePal hardware wallet device connection
 * @module n8n-nodes-safepal/credentials/SafePalDevice
 *
 * SPDX-License-Identifier: BSL-1.1
 * Copyright (c) 2025 Velocity Business Partners LLC
 * Business Source License 1.1 - See LICENSE file for details
 * Licensed work: n8n-nodes-safepal
 * Change Date: 2029-01-01
 * Change License: GPL-3.0-or-later
 */

import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SafePalDeviceCredentials implements ICredentialType {
	name = 'safePalDeviceCredentials';
	displayName = 'SafePal Device';
	documentationUrl = 'https://docs.safepal.io/';
	icon = 'file:safepal.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Connection Type',
			name: 'connectionType',
			type: 'options',
			options: [
				{
					name: 'QR Code (S1/S1 Pro)',
					value: 'qr',
					description: 'Air-gapped QR code communication',
				},
				{
					name: 'Bluetooth (X1)',
					value: 'bluetooth',
					description: 'Bluetooth Low Energy connection',
				},
			],
			default: 'qr',
			description: 'How to communicate with the SafePal device',
		},
		{
			displayName: 'Device Model',
			name: 'deviceModel',
			type: 'options',
			options: [
				{
					name: 'SafePal S1',
					value: 's1',
					description: 'Original air-gapped hardware wallet',
				},
				{
					name: 'SafePal S1 Pro',
					value: 's1_pro',
					description: 'Enhanced air-gapped wallet with larger display',
				},
				{
					name: 'SafePal X1',
					value: 'x1',
					description: 'Bluetooth-enabled hardware wallet',
				},
			],
			default: 's1',
			description: 'SafePal device model',
		},
		{
			displayName: 'Device ID',
			name: 'deviceId',
			type: 'string',
			default: '',
			placeholder: 'e.g., SP-X1-XXXXX or device serial',
			description: 'Device identifier (required for Bluetooth)',
			displayOptions: {
				show: {
					connectionType: ['bluetooth'],
				},
			},
		},
		{
			displayName: 'Device Name',
			name: 'deviceName',
			type: 'string',
			default: 'My SafePal',
			description: 'Friendly name for this device',
		},
		{
			displayName: 'QR Code Settings',
			name: 'qrSettings',
			type: 'collection',
			placeholder: 'Configure QR Options',
			default: {},
			displayOptions: {
				show: {
					connectionType: ['qr'],
				},
			},
			options: [
				{
					displayName: 'QR Code Size',
					name: 'qrSize',
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
					description: 'Error correction level for QR codes',
				},
				{
					displayName: 'Animated Frame Duration (ms)',
					name: 'frameDuration',
					type: 'number',
					default: 200,
					description: 'Duration per frame for animated QR codes',
				},
			],
		},
		{
			displayName: 'Bluetooth Settings',
			name: 'bluetoothSettings',
			type: 'collection',
			placeholder: 'Configure Bluetooth Options',
			default: {},
			displayOptions: {
				show: {
					connectionType: ['bluetooth'],
				},
			},
			options: [
				{
					displayName: 'Connection Timeout (ms)',
					name: 'connectionTimeout',
					type: 'number',
					default: 30000,
					description: 'Bluetooth connection timeout',
				},
				{
					displayName: 'Command Timeout (ms)',
					name: 'commandTimeout',
					type: 'number',
					default: 60000,
					description: 'Command response timeout',
				},
				{
					displayName: 'Auto Reconnect',
					name: 'autoReconnect',
					type: 'boolean',
					default: true,
					description: 'Whether to automatically reconnect on disconnect',
				},
			],
		},
		{
			displayName: 'Default Chain',
			name: 'defaultChain',
			type: 'options',
			options: [
				{ name: 'Bitcoin', value: 'bitcoin' },
				{ name: 'Ethereum', value: 'ethereum' },
				{ name: 'BNB Smart Chain', value: 'bsc' },
				{ name: 'Polygon', value: 'polygon' },
				{ name: 'Solana', value: 'solana' },
				{ name: 'Arbitrum', value: 'arbitrum' },
				{ name: 'Optimism', value: 'optimism' },
				{ name: 'Avalanche C-Chain', value: 'avalanche' },
				{ name: 'Cosmos Hub', value: 'cosmos' },
				{ name: 'Tron', value: 'tron' },
			],
			default: 'ethereum',
			description: 'Default blockchain for operations',
		},
		{
			displayName: 'Account Index',
			name: 'accountIndex',
			type: 'number',
			default: 0,
			description: 'Default account index for derivation path',
		},
		{
			displayName: 'Testnet Mode',
			name: 'testnet',
			type: 'boolean',
			default: false,
			description: 'Whether to use testnet networks',
		},
	];

	// Device credentials don't require external authentication
	// Connection is established via QR or Bluetooth
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	// Test verifies the credential configuration is valid
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.safepal.io',
			url: '/v1/health',
			method: 'GET',
		},
	};
}
