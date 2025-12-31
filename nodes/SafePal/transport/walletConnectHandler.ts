/**
 * @file WalletConnect Transport Handler
 * @description Handles WalletConnect v2 protocol for DApp connectivity
 * @module n8n-nodes-safepal/transport/walletConnectHandler
 *
 * SPDX-License-Identifier: BSL-1.1
 * Copyright (c) 2025 Velocity Business Partners LLC
 * Business Source License 1.1 - See LICENSE file for details
 * Licensed work: n8n-nodes-safepal
 * Change Date: 2029-01-01
 * Change License: GPL-3.0-or-later
 */

import { getEvmChains } from '../constants/chains';

/**
 * WalletConnect configuration
 */
export interface WalletConnectConfig {
	/** WalletConnect project ID */
	projectId: string;
	/** Relay URL */
	relayUrl: string;
	/** Metadata for DApp identification */
	metadata: WalletConnectMetadata;
	/** Session timeout in ms */
	sessionTimeout: number;
	/** Request timeout in ms */
	requestTimeout: number;
}

/**
 * DApp/Wallet metadata
 */
export interface WalletConnectMetadata {
	name: string;
	description: string;
	url: string;
	icons: string[];
}

/**
 * WalletConnect session
 */
export interface WalletConnectSession {
	/** Session topic (unique identifier) */
	topic: string;
	/** Peer metadata */
	peer: WalletConnectMetadata;
	/** Namespaces with chains and methods */
	namespaces: Record<string, WalletConnectNamespace>;
	/** Session expiry timestamp */
	expiry: number;
	/** Acknowledged status */
	acknowledged: boolean;
	/** Connected accounts */
	accounts: string[];
	/** Active chains */
	chains: string[];
}

/**
 * WalletConnect namespace
 */
export interface WalletConnectNamespace {
	chains: string[];
	methods: string[];
	events: string[];
	accounts: string[];
}

/**
 * Connection request
 */
export interface ConnectionRequest {
	/** Required namespaces */
	requiredNamespaces: Record<string, {
		chains: string[];
		methods: string[];
		events: string[];
	}>;
	/** Optional namespaces */
	optionalNamespaces?: Record<string, {
		chains: string[];
		methods: string[];
		events: string[];
	}>;
}

/**
 * Session request
 */
export interface SessionRequest {
	id: number;
	topic: string;
	params: {
		request: {
			method: string;
			params: unknown[];
		};
		chainId: string;
	};
}

/**
 * Request result
 */
export interface RequestResult {
	success: boolean;
	result?: unknown;
	error?: {
		code: number;
		message: string;
	};
}

/**
 * Pairing info
 */
export interface PairingInfo {
	uri: string;
	topic: string;
	expiry: number;
}

/**
 * Event types
 */
export type WalletConnectEventType =
	| 'session_proposal'
	| 'session_request'
	| 'session_delete'
	| 'session_update'
	| 'session_event'
	| 'pairing_created'
	| 'pairing_deleted'
	| 'connection_error';

/**
 * Event handler
 */
export type WalletConnectEventHandler = (event: WalletConnectEventType, data: unknown) => void;

/**
 * Standard EVM methods supported
 */
export const EVM_METHODS = [
	'eth_sendTransaction',
	'eth_signTransaction',
	'eth_sign',
	'personal_sign',
	'eth_signTypedData',
	'eth_signTypedData_v3',
	'eth_signTypedData_v4',
	'wallet_switchEthereumChain',
	'wallet_addEthereumChain',
] as const;

/**
 * Standard EVM events
 */
export const EVM_EVENTS = [
	'chainChanged',
	'accountsChanged',
] as const;

/**
 * WalletConnect Handler Class
 * Manages WalletConnect v2 protocol connections
 */
export class WalletConnectHandler {
	private config: WalletConnectConfig;
	private sessions: Map<string, WalletConnectSession>;
	private pairings: Map<string, PairingInfo>;
	private eventHandlers: WalletConnectEventHandler[];
	private pendingRequests: Map<number, {
		resolve: (value: unknown) => void;
		reject: (error: Error) => void;
		timeout: NodeJS.Timeout;
	}>;

	constructor(config: Partial<WalletConnectConfig> = {}) {
		this.config = {
			projectId: '',
			relayUrl: 'wss://relay.walletconnect.com',
			metadata: {
				name: 'n8n SafePal Integration',
				description: 'n8n workflow automation with SafePal wallet',
				url: 'https://n8n.io',
				icons: ['https://n8n.io/favicon.ico'],
			},
			sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
			requestTimeout: 300000, // 5 minutes
			...config,
		};

		this.sessions = new Map();
		this.pairings = new Map();
		this.eventHandlers = [];
		this.pendingRequests = new Map();
	}

	/**
	 * Initialize WalletConnect
	 */
	async initialize(): Promise<void> {
		if (!this.config.projectId) {
			throw new Error('WalletConnect project ID is required');
		}

		// In a real implementation, this would initialize the WalletConnect SignClient
		// SignClient.init({ projectId, relayUrl, metadata })
	}

	/**
	 * Create new pairing URI for connection
	 */
	async createPairing(): Promise<PairingInfo> {
		const topic = this.generateTopic();
		const expiry = Date.now() + 300000; // 5 minutes

		// Generate WalletConnect URI
		const uri = this.generatePairingUri(topic);

		const pairing: PairingInfo = {
			uri,
			topic,
			expiry,
		};

		this.pairings.set(topic, pairing);
		this.emitEvent('pairing_created', pairing);

		return pairing;
	}

	/**
	 * Connect to wallet using pairing URI
	 */
	async connect(request: ConnectionRequest): Promise<{ uri: string; approval: Promise<WalletConnectSession> }> {
		const pairing = await this.createPairing();

		const approval = new Promise<WalletConnectSession>((resolve, reject) => {
			// Set up session approval timeout
			const timeout = setTimeout(() => {
				this.pairings.delete(pairing.topic);
				reject(new Error('Session approval timeout'));
			}, this.config.requestTimeout);

			// In real implementation, this would listen for session_proposal response
			// For now, simulate approval flow
			this.simulateSessionApproval(pairing.topic, request, resolve, reject, timeout);
		});

		return { uri: pairing.uri, approval };
	}

	/**
	 * Approve session proposal
	 */
	async approveSession(
		proposal: { id: number; params: ConnectionRequest },
		accounts: string[],
		chains: string[],
	): Promise<WalletConnectSession> {
		const topic = this.generateTopic();
		const expiry = Date.now() + this.config.sessionTimeout;

		// Build namespaces from proposal and provided accounts
		const namespaces = this.buildNamespaces(proposal.params, accounts, chains);

		const session: WalletConnectSession = {
			topic,
			peer: {
				name: 'Unknown DApp',
				description: '',
				url: '',
				icons: [],
			},
			namespaces,
			expiry,
			acknowledged: true,
			accounts,
			chains,
		};

		this.sessions.set(topic, session);

		return session;
	}

	/**
	 * Reject session proposal
	 */
	async rejectSession(proposalId: number, reason: string): Promise<void> {
		// In real implementation, this would send rejection through SignClient
		this.emitEvent('session_delete', { proposalId, reason });
	}

	/**
	 * Get active session
	 */
	getSession(topic: string): WalletConnectSession | undefined {
		return this.sessions.get(topic);
	}

	/**
	 * Get all active sessions
	 */
	getAllSessions(): WalletConnectSession[] {
		return Array.from(this.sessions.values());
	}

	/**
	 * Disconnect session
	 */
	async disconnect(topic: string): Promise<void> {
		const session = this.sessions.get(topic);
		if (!session) {
			throw new Error('Session not found');
		}

		this.sessions.delete(topic);
		this.emitEvent('session_delete', { topic });
	}

	/**
	 * Disconnect all sessions
	 */
	async disconnectAll(): Promise<void> {
		for (const topic of this.sessions.keys()) {
			await this.disconnect(topic);
		}
	}

	/**
	 * Send request to wallet
	 */
	async request<T = unknown>(
		topic: string,
		chainId: string,
		method: string,
		params: unknown[],
	): Promise<T> {
		const session = this.sessions.get(topic);
		if (!session) {
			throw new Error('Session not found');
		}

		// Validate chain is in session
		if (!session.chains.includes(chainId)) {
			throw new Error(`Chain ${chainId} not authorized in session`);
		}

		// Validate method is allowed
		const namespace = chainId.split(':')[0];
		const namespaceData = session.namespaces[namespace];
		if (!namespaceData?.methods.includes(method)) {
			throw new Error(`Method ${method} not authorized in session`);
		}

		const requestId = this.generateRequestId();

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.pendingRequests.delete(requestId);
				reject(new Error('Request timeout'));
			}, this.config.requestTimeout);

			this.pendingRequests.set(requestId, {
				resolve: resolve as (value: unknown) => void,
				reject,
				timeout,
			});

			// Emit request event (in real impl, this would go through SignClient)
			this.emitEvent('session_request', {
				id: requestId,
				topic,
				params: {
					request: { method, params },
					chainId,
				},
			});
		});
	}

	/**
	 * Respond to session request
	 */
	async respond(requestId: number, result: RequestResult): Promise<void> {
		const pending = this.pendingRequests.get(requestId);
		if (!pending) {
			throw new Error('Request not found');
		}

		clearTimeout(pending.timeout);
		this.pendingRequests.delete(requestId);

		if (result.success) {
			pending.resolve(result.result);
		} else {
			pending.reject(new Error(result.error?.message || 'Request failed'));
		}
	}

	/**
	 * Request personal signature
	 */
	async signPersonalMessage(topic: string, chainId: string, message: string, address: string): Promise<string> {
		return this.request<string>(topic, chainId, 'personal_sign', [message, address]);
	}

	/**
	 * Request typed data signature (EIP-712)
	 */
	async signTypedData(
		topic: string,
		chainId: string,
		address: string,
		typedData: Record<string, unknown>,
	): Promise<string> {
		return this.request<string>(topic, chainId, 'eth_signTypedData_v4', [
			address,
			JSON.stringify(typedData),
		]);
	}

	/**
	 * Request transaction signing
	 */
	async signTransaction(
		topic: string,
		chainId: string,
		transaction: Record<string, unknown>,
	): Promise<string> {
		return this.request<string>(topic, chainId, 'eth_signTransaction', [transaction]);
	}

	/**
	 * Request transaction send
	 */
	async sendTransaction(
		topic: string,
		chainId: string,
		transaction: Record<string, unknown>,
	): Promise<string> {
		return this.request<string>(topic, chainId, 'eth_sendTransaction', [transaction]);
	}

	/**
	 * Emit session event to DApp
	 */
	async emitSessionEvent(topic: string, event: string, data: unknown): Promise<void> {
		const session = this.sessions.get(topic);
		if (!session) {
			throw new Error('Session not found');
		}

		this.emitEvent('session_event', { topic, event, data });
	}

	/**
	 * Update session (change accounts/chains)
	 */
	async updateSession(topic: string, accounts: string[], chains: string[]): Promise<void> {
		const session = this.sessions.get(topic);
		if (!session) {
			throw new Error('Session not found');
		}

		session.accounts = accounts;
		session.chains = chains;

		// Update namespace accounts
		for (const namespace of Object.keys(session.namespaces)) {
			session.namespaces[namespace].accounts = accounts.filter((a) => a.startsWith(`${namespace}:`));
			session.namespaces[namespace].chains = chains.filter((c) => c.startsWith(`${namespace}:`));
		}

		this.emitEvent('session_update', { topic, accounts, chains });
	}

	/**
	 * Add event handler
	 */
	addEventListener(handler: WalletConnectEventHandler): void {
		this.eventHandlers.push(handler);
	}

	/**
	 * Remove event handler
	 */
	removeEventListener(handler: WalletConnectEventHandler): void {
		const index = this.eventHandlers.indexOf(handler);
		if (index !== -1) {
			this.eventHandlers.splice(index, 1);
		}
	}

	/**
	 * Parse pairing URI
	 */
	parsePairingUri(uri: string): { topic: string; relay: string; symKey: string } {
		// WalletConnect URI format: wc:{topic}@{version}?relay-protocol={protocol}&symKey={key}
		const regex = /wc:([^@]+)@(\d+)\?(.+)/;
		const match = uri.match(regex);

		if (!match) {
			throw new Error('Invalid WalletConnect URI');
		}

		const topic = match[1];
		const params = new URLSearchParams(match[3]);

		return {
			topic,
			relay: params.get('relay-protocol') || 'irn',
			symKey: params.get('symKey') || '',
		};
	}

	/**
	 * Generate chain ID in CAIP-2 format
	 */
	formatChainId(chainType: string, chainId: number | string): string {
		return `${chainType}:${chainId}`;
	}

	/**
	 * Get EVM chain IDs in CAIP-2 format
	 */
	getEvmChainIds(): string[] {
		return getEvmChains().map((chain) => `eip155:${chain.chainId}`);
	}

	/**
	 * Build default EVM required namespaces
	 */
	buildEvmNamespaces(chainIds: number[]): ConnectionRequest {
		const chains = chainIds.map((id) => `eip155:${id}`);

		return {
			requiredNamespaces: {
				eip155: {
					chains,
					methods: [...EVM_METHODS],
					events: [...EVM_EVENTS],
				},
			},
		};
	}

	/**
	 * Check if session is expired
	 */
	isSessionExpired(session: WalletConnectSession): boolean {
		return Date.now() > session.expiry;
	}

	/**
	 * Clean up expired sessions
	 */
	cleanupExpiredSessions(): number {
		let cleaned = 0;
		for (const [topic, session] of this.sessions) {
			if (this.isSessionExpired(session)) {
				this.sessions.delete(topic);
				cleaned++;
			}
		}
		return cleaned;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<WalletConnectConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): WalletConnectConfig {
		return { ...this.config };
	}

	/**
	 * Emit event to handlers
	 */
	private emitEvent(event: WalletConnectEventType, data: unknown): void {
		for (const handler of this.eventHandlers) {
			try {
				handler(event, data);
			} catch (error) {
				console.error('Error in WalletConnect event handler:', error);
			}
		}
	}

	/**
	 * Generate random topic
	 */
	private generateTopic(): string {
		const bytes = new Uint8Array(32);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Math.floor(Math.random() * 256);
		}
		return Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}

	/**
	 * Generate request ID
	 */
	private generateRequestId(): number {
		return Date.now() * 1000 + Math.floor(Math.random() * 1000);
	}

	/**
	 * Generate pairing URI
	 */
	private generatePairingUri(topic: string): string {
		const symKey = this.generateTopic();
		const relay = 'irn';
		return `wc:${topic}@2?relay-protocol=${relay}&symKey=${symKey}`;
	}

	/**
	 * Build namespaces from proposal
	 */
	private buildNamespaces(
		request: ConnectionRequest,
		accounts: string[],
		chains: string[],
	): Record<string, WalletConnectNamespace> {
		const namespaces: Record<string, WalletConnectNamespace> = {};

		// Process required namespaces
		for (const [key, value] of Object.entries(request.requiredNamespaces)) {
			namespaces[key] = {
				chains: chains.filter((c) => c.startsWith(`${key}:`)),
				methods: value.methods,
				events: value.events,
				accounts: accounts.filter((a) => a.startsWith(`${key}:`)),
			};
		}

		// Process optional namespaces
		if (request.optionalNamespaces) {
			for (const [key, value] of Object.entries(request.optionalNamespaces)) {
				if (!namespaces[key]) {
					namespaces[key] = {
						chains: chains.filter((c) => c.startsWith(`${key}:`)),
						methods: value.methods,
						events: value.events,
						accounts: accounts.filter((a) => a.startsWith(`${key}:`)),
					};
				} else {
					// Merge methods and events
					namespaces[key].methods = [...new Set([...namespaces[key].methods, ...value.methods])];
					namespaces[key].events = [...new Set([...namespaces[key].events, ...value.events])];
				}
			}
		}

		return namespaces;
	}

	/**
	 * Simulate session approval (for development/testing)
	 */
	private simulateSessionApproval(
		_topic: string,
		request: ConnectionRequest,
		resolve: (session: WalletConnectSession) => void,
		reject: (error: Error) => void,
		timeout: NodeJS.Timeout,
	): void {
		// In simulation mode, auto-approve after delay
		setTimeout(async () => {
			try {
				clearTimeout(timeout);

				// Generate mock accounts
				const mockAddress = '0x' + this.generateTopic().slice(0, 40);
				const chains = request.requiredNamespaces.eip155?.chains || ['eip155:1'];
				const accounts = chains.map((c) => `${c}:${mockAddress}`);

				const session = await this.approveSession(
					{ id: Date.now(), params: request },
					accounts,
					chains,
				);

				resolve(session);
			} catch (error) {
				reject(error as Error);
			}
		}, 1000);
	}
}

/**
 * Create new WalletConnect handler
 */
export function createWalletConnectHandler(config?: Partial<WalletConnectConfig>): WalletConnectHandler {
	return new WalletConnectHandler(config);
}

/**
 * Default WalletConnect handler instance
 */
export const defaultWalletConnectHandler = new WalletConnectHandler();
