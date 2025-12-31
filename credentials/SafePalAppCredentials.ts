/**
 * @file SafePal App Credentials
 * @description Credentials for SafePal mobile app API integration
 * @module n8n-nodes-safepal/credentials/SafePalApp
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
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SafePalAppCredentials implements ICredentialType {
	name = 'safePalAppCredentials';
	displayName = 'SafePal App';
	documentationUrl = 'https://docs.safepal.io/api';
	icon = 'file:safepal.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'SafePal API key for app integration',
		},
		{
			displayName: 'API Secret',
			name: 'apiSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'SafePal API secret',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Production',
					value: 'production',
					description: 'Production environment',
				},
				{
					name: 'Sandbox',
					value: 'sandbox',
					description: 'Testing environment',
				},
			],
			default: 'production',
			description: 'API environment to use',
		},
		{
			displayName: 'API Base URL',
			name: 'apiBaseUrl',
			type: 'string',
			default: 'https://api.safepal.io',
			description: 'Base URL for SafePal API',
			displayOptions: {
				show: {
					environment: ['production'],
				},
			},
		},
		{
			displayName: 'Sandbox Base URL',
			name: 'sandboxBaseUrl',
			type: 'string',
			default: 'https://sandbox-api.safepal.io',
			description: 'Base URL for SafePal sandbox API',
			displayOptions: {
				show: {
					environment: ['sandbox'],
				},
			},
		},
		{
			displayName: 'Webhook URL',
			name: 'webhookUrl',
			type: 'string',
			default: '',
			placeholder: 'https://your-domain.com/webhook/safepal',
			description: 'URL for receiving SafePal webhooks',
		},
		{
			displayName: 'Webhook Secret',
			name: 'webhookSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Secret for validating webhook signatures',
		},
		{
			displayName: 'Request Timeout (ms)',
			name: 'timeout',
			type: 'number',
			default: 30000,
			description: 'API request timeout',
		},
		{
			displayName: 'Retry on Failure',
			name: 'retryOnFailure',
			type: 'boolean',
			default: true,
			description: 'Whether to retry failed API requests',
		},
		{
			displayName: 'Max Retries',
			name: 'maxRetries',
			type: 'number',
			default: 3,
			description: 'Maximum number of retry attempts',
			displayOptions: {
				show: {
					retryOnFailure: [true],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
				'X-API-Secret': '={{$credentials.apiSecret}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.environment === "production" ? $credentials.apiBaseUrl : $credentials.sandboxBaseUrl}}',
			url: '/v1/account/verify',
			method: 'GET',
		},
	};
}
