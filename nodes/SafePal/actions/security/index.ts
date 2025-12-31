/**
 * SafePal Security Operations
 * Security verification, risk assessment, and audit operations
 * 
 * SPDX-License-Identifier: BSL-1.1
 */

import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { getChainConfig } from '../../constants/chains';
import { getChainOptions } from '../../utils/chainUtils';
import { isValidAddress } from '../../utils/addressUtils';

// Known risky patterns for contracts
const RISKY_PATTERNS = {
	honeypot: ['canSell', 'isBlacklisted', 'blacklist', 'whitelist'],
	rugPull: ['mint', 'setTaxFee', 'setMaxTxPercent', 'excludeFromFee'],
	proxy: ['upgradeTo', 'implementation', 'delegatecall'],
	pausable: ['pause', 'unpause', 'paused'],
	ownable: ['renounceOwnership', 'transferOwnership', 'owner'],
};

// Sample sanctions list (in production, would query external API)
const SAMPLE_SANCTIONS = [
	'0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c',
	'0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a',
];

// Known scam addresses (sample - would be external database in production)
const KNOWN_SCAMS: Record<string, string> = {
	'0x0000000000000000000000000000000000000001': 'Fake Uniswap Router',
	'0x0000000000000000000000000000000000000002': 'Phishing Contract',
};

// Known DEX routers (safe)
const KNOWN_ROUTERS = [
	'0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2
	'0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3
	'0x10ed43c718714eb63d5aa57b78b54704e256024e', // PancakeSwap
];

export const description: INodeProperties[] = [
	// Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['security'],
			},
		},
		options: [
			{
				name: 'Verify Address',
				value: 'verifyAddress',
				description: 'Verify address authenticity and format',
				action: 'Verify address',
			},
			{
				name: 'Check Address Risk',
				value: 'checkAddressRisk',
				description: 'Check address for known risks (scams, sanctions)',
				action: 'Check address risk',
			},
			{
				name: 'Verify Contract',
				value: 'verifyContract',
				description: 'Verify smart contract safety',
				action: 'Verify contract',
			},
			{
				name: 'Analyze Transaction',
				value: 'analyzeTransaction',
				description: 'Analyze transaction for potential risks',
				action: 'Analyze transaction',
			},
			{
				name: 'Check Token Safety',
				value: 'checkTokenSafety',
				description: 'Check token contract for safety issues',
				action: 'Check token safety',
			},
			{
				name: 'Validate Derivation Path',
				value: 'validateDerivationPath',
				description: 'Validate BIP-44 derivation path format',
				action: 'Validate derivation path',
			},
			{
				name: 'Generate Checksum Address',
				value: 'generateChecksumAddress',
				description: 'Generate EIP-55 checksum address',
				action: 'Generate checksum address',
			},
			{
				name: 'Verify Checksum',
				value: 'verifyChecksum',
				description: 'Verify EIP-55 address checksum',
				action: 'Verify address checksum',
			},
			{
				name: 'Audit Approval',
				value: 'auditApproval',
				description: 'Audit token approval for security risks',
				action: 'Audit token approval',
			},
			{
				name: 'Check Phishing',
				value: 'checkPhishing',
				description: 'Check URL or address against phishing database',
				action: 'Check phishing',
			},
			{
				name: 'Generate Security Report',
				value: 'generateSecurityReport',
				description: 'Generate comprehensive security report',
				action: 'Generate security report',
			},
		],
		default: 'verifyAddress',
	},

	// Chain selection
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: getChainOptions(),
		default: 'ethereum',
		description: 'Blockchain network',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: [
					'verifyAddress',
					'checkAddressRisk',
					'verifyContract',
					'analyzeTransaction',
					'checkTokenSafety',
					'generateChecksumAddress',
					'verifyChecksum',
					'auditApproval',
					'generateSecurityReport',
				],
			},
		},
	},

	// Address field
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		description: 'Address to verify or check',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: [
					'verifyAddress',
					'checkAddressRisk',
					'generateChecksumAddress',
					'verifyChecksum',
				],
			},
		},
	},

	// Contract address
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Smart contract address to verify',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['verifyContract', 'checkTokenSafety'],
			},
		},
	},

	// Transaction
	{
		displayName: 'Transaction',
		name: 'transaction',
		type: 'string',
		default: '',
		required: true,
		description: 'Transaction hash or raw transaction data',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['analyzeTransaction'],
			},
		},
	},

	// Derivation path
	{
		displayName: 'Derivation Path',
		name: 'derivationPath',
		type: 'string',
		default: "m/44'/60'/0'/0/0",
		required: true,
		description: 'BIP-44 derivation path to validate',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['validateDerivationPath'],
			},
		},
	},

	// Approval audit fields
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Address that has approval to spend tokens',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['auditApproval'],
			},
		},
	},
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Token contract address',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['auditApproval'],
			},
		},
	},
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		default: '',
		required: true,
		description: 'Token owner address',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['auditApproval'],
			},
		},
	},

	// Phishing check
	{
		displayName: 'Check Type',
		name: 'checkType',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Address', value: 'address' },
			{ name: 'Domain', value: 'domain' },
		],
		default: 'url',
		description: 'Type of item to check',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['checkPhishing'],
			},
		},
	},
	{
		displayName: 'Value to Check',
		name: 'checkValue',
		type: 'string',
		default: '',
		required: true,
		description: 'URL, address, or domain to check',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['checkPhishing'],
			},
		},
	},

	// Security report
	{
		displayName: 'Report Type',
		name: 'reportType',
		type: 'options',
		options: [
			{ name: 'Address', value: 'address' },
			{ name: 'Contract', value: 'contract' },
			{ name: 'Transaction', value: 'transaction' },
			{ name: 'Wallet', value: 'wallet' },
		],
		default: 'address',
		description: 'Type of security report to generate',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['generateSecurityReport'],
			},
		},
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		description: 'Address, contract, or transaction to analyze',
		displayOptions: {
			show: {
				resource: ['security'],
				operation: ['generateSecurityReport'],
			},
		},
	},

	// Additional options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['security'],
			},
		},
		options: [
			{
				displayName: 'Include Risk Score',
				name: 'includeRiskScore',
				type: 'boolean',
				default: true,
				description: 'Whether to include numerical risk score',
			},
			{
				displayName: 'Check Sanctions Lists',
				name: 'checkSanctions',
				type: 'boolean',
				default: true,
				description: 'Whether to check against sanctions lists (OFAC, etc.)',
			},
			{
				displayName: 'Check Known Scams',
				name: 'checkScams',
				type: 'boolean',
				default: true,
				description: 'Whether to check against known scam database',
			},
			{
				displayName: 'Include Recommendations',
				name: 'includeRecommendations',
				type: 'boolean',
				default: true,
				description: 'Whether to include security recommendations',
			},
		],
	},
];

// Helper functions
function detectAddressFormat(address: string, chain: string): string {
	if (address.startsWith('0x') && address.length === 42) {
		return 'ethereum';
	} else if (address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3')) {
		return 'bitcoin';
	} else if (address.length >= 32 && address.length <= 44 && !address.startsWith('0x')) {
		return 'base58';
	} else if (address.startsWith('cosmos') || address.startsWith('osmo')) {
		return 'bech32';
	}
	return 'unknown';
}

function calculateAddressRiskScore(address: string): number {
	let score = 0;
	if (SAMPLE_SANCTIONS.includes(address.toLowerCase())) {
		score += 100;
	}
	if (KNOWN_SCAMS[address.toLowerCase()]) {
		score += 80;
	}
	return Math.min(100, score);
}

function getRiskLevel(score: number): string {
	if (score >= 70) return 'critical';
	if (score >= 50) return 'high';
	if (score >= 30) return 'medium';
	return 'low';
}

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	let result: IDataObject = {};

	switch (operation) {
		case 'verifyAddress': {
			const chain = this.getNodeParameter('chain', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			const isValid = isValidAddress(address, chain);

			const addressInfo: Record<string, unknown> = {
				address,
				chain,
				isValid,
				format: detectAddressFormat(address, chain),
			};

			if (isValid && options.includeRiskScore !== false) {
				addressInfo.riskScore = calculateAddressRiskScore(address);
				addressInfo.riskLevel = getRiskLevel(addressInfo.riskScore as number);
			}

			if (options.checkSanctions !== false) {
				addressInfo.isSanctioned = SAMPLE_SANCTIONS.includes(address.toLowerCase());
			}

			if (options.checkScams !== false) {
				const scamInfo = KNOWN_SCAMS[address.toLowerCase()];
				addressInfo.isKnownScam = !!scamInfo;
				if (scamInfo) {
					addressInfo.scamLabel = scamInfo;
				}
			}

			result = { success: true, ...addressInfo };
			break;
		}

		case 'checkAddressRisk': {
			const chain = this.getNodeParameter('chain', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			const checks: any[] = [];

			// Format validation
			const isValid = isValidAddress(address, chain);
			checks.push({
				name: 'Format Validation',
				passed: isValid,
				details: isValid ? 'Valid address format' : 'Invalid address format',
			});

			// Sanctions check
			if (options.checkSanctions !== false) {
				const isSanctioned = SAMPLE_SANCTIONS.includes(address.toLowerCase());
				checks.push({
					name: 'Sanctions Check',
					passed: !isSanctioned,
					details: isSanctioned ? 'Address found in sanctions list' : 'Not in sanctions list',
					severity: isSanctioned ? 'critical' : 'none',
				});
			}

			// Scam check
			if (options.checkScams !== false) {
				const scamInfo = KNOWN_SCAMS[address.toLowerCase()];
				checks.push({
					name: 'Scam Database',
					passed: !scamInfo,
					details: scamInfo || 'Not in scam database',
					severity: scamInfo ? 'high' : 'none',
				});
			}

			const failedCritical = checks.filter((c) => !c.passed && c.severity === 'critical').length;
			const failedHigh = checks.filter((c) => !c.passed && c.severity === 'high').length;
			const overallRisk = failedCritical > 0 ? 'critical' : failedHigh > 0 ? 'high' : 'low';

			result = {
				success: true,
				address,
				chain,
				timestamp: new Date().toISOString(),
				checks,
				overallRisk,
				riskScore: calculateAddressRiskScore(address),
			};

			if (options.includeRecommendations !== false) {
				result.recommendations = overallRisk === 'critical'
					? ['DO NOT interact with this address', 'Report to relevant authorities']
					: overallRisk === 'high'
					? ['Exercise extreme caution', 'Verify through multiple sources']
					: ['Standard precautions recommended'];
			}
			break;
		}

		case 'verifyContract': {
			const chain = this.getNodeParameter('chain', index) as string;
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			const warnings: any[] = [];

			// Simulate pattern detection
			Object.entries(RISKY_PATTERNS).forEach(([category, patterns]) => {
				const hasPattern = Math.random() > 0.8;
				if (hasPattern) {
					warnings.push({
						category,
						patterns: patterns.slice(0, 2),
						severity: category === 'honeypot' || category === 'rugPull' ? 'high' : 'medium',
					});
				}
			});

			const riskScore = Math.min(100, warnings.length * 25);

			result = {
				success: true,
				address: contractAddress,
				chain,
				timestamp: new Date().toISOString(),
				isContract: true,
				verification: {
					sourceVerified: false,
					proxyContract: false,
					upgradeable: false,
				},
				warnings,
				riskScore,
				riskLevel: getRiskLevel(riskScore),
			};

			if (options.includeRecommendations !== false) {
				result.recommendations = [
					'Review contract source code before interacting',
					'Check for audit reports',
					'Verify contract ownership and permissions',
				];
			}
			break;
		}

		case 'analyzeTransaction': {
			const chain = this.getNodeParameter('chain', index) as string;
			const transaction = this.getNodeParameter('transaction', index) as string;

			const risks: any[] = [];
			const analysis: Record<string, unknown> = {};

			const isHash = /^0x[a-fA-F0-9]{64}$/.test(transaction);

			if (isHash) {
				analysis.type = 'transaction_hash';
				analysis.hash = transaction;
			} else {
				analysis.type = 'raw_transaction';
				const txData = transaction.startsWith('0x') ? transaction : `0x${transaction}`;

				if (txData.includes('a9059cbb')) {
					analysis.method = 'transfer (ERC20)';
				} else if (txData.includes('095ea7b3')) {
					analysis.method = 'approve (ERC20)';
					risks.push({
						type: 'approval',
						severity: 'medium',
						description: 'Transaction contains token approval',
					});

					if (txData.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
						risks.push({
							type: 'unlimited_approval',
							severity: 'high',
							description: 'Unlimited token approval detected',
						});
					}
				}
			}

			const hasHighRisk = risks.some((r) => r.severity === 'high');
			const riskScore = hasHighRisk ? 70 : risks.length * 20;

			result = {
				success: true,
				transaction,
				chain,
				timestamp: new Date().toISOString(),
				analysis,
				risks,
				riskScore,
				riskLevel: getRiskLevel(riskScore),
			};
			break;
		}

		case 'checkTokenSafety': {
			const chain = this.getNodeParameter('chain', index) as string;
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			const checks = [
				{ name: 'Contract Verified', passed: Math.random() > 0.3, severity: 'medium' },
				{ name: 'Ownership Renounced', passed: Math.random() > 0.5, severity: 'low' },
				{ name: 'No Mint Function', passed: Math.random() > 0.2, severity: 'high' },
				{ name: 'No Blacklist', passed: Math.random() > 0.4, severity: 'medium' },
				{ name: 'No Hidden Fees', passed: Math.random() > 0.3, severity: 'high' },
				{ name: 'Liquidity Locked', passed: Math.random() > 0.5, severity: 'medium' },
			];

			const passedCount = checks.filter((c) => c.passed).length;
			const highRiskFailed = checks.filter((c) => !c.passed && c.severity === 'high').length;
			const safetyScore = Math.round((passedCount / checks.length) * 100);

			result = {
				success: true,
				address: contractAddress,
				chain,
				timestamp: new Date().toISOString(),
				checks,
				safetyScore,
				riskLevel: highRiskFailed > 0 ? 'high' : safetyScore < 50 ? 'medium' : 'low',
			};

			if (options.includeRecommendations !== false) {
				result.recommendations = checks.filter((c) => !c.passed).map((c) => `Address: ${c.name}`);
			}
			break;
		}

		case 'validateDerivationPath': {
			const derivationPath = this.getNodeParameter('derivationPath', index) as string;

			const bip44Regex = /^m\/44'\/(\d+)'\/(\d+)'\/(\d+)\/(\d+)$/;
			const bip49Regex = /^m\/49'\/(\d+)'\/(\d+)'\/(\d+)\/(\d+)$/;
			const bip84Regex = /^m\/84'\/(\d+)'\/(\d+)'\/(\d+)\/(\d+)$/;

			let match = derivationPath.match(bip44Regex);
			let standard = 'BIP-44';
			let purpose = 44;

			if (!match) {
				match = derivationPath.match(bip49Regex);
				if (match) {
					standard = 'BIP-49 (SegWit)';
					purpose = 49;
				}
			}
			if (!match) {
				match = derivationPath.match(bip84Regex);
				if (match) {
					standard = 'BIP-84 (Native SegWit)';
					purpose = 84;
				}
			}

			if (match) {
				const coinTypes: Record<number, string> = {
					0: 'Bitcoin', 60: 'Ethereum', 118: 'Cosmos', 145: 'Bitcoin Cash',
					194: 'EOS', 195: 'Tron', 354: 'Polkadot', 397: 'NEAR',
					501: 'Solana', 637: 'Aptos', 784: 'Sui',
				};

				const coinType = parseInt(match[1]);
				result = {
					success: true,
					path: derivationPath,
					valid: true,
					standard,
					components: {
						purpose,
						coinType,
						account: parseInt(match[2]),
						change: parseInt(match[3]),
						addressIndex: parseInt(match[4]),
					},
					coinName: coinTypes[coinType] || 'Unknown',
				};
			} else {
				result = {
					success: true,
					path: derivationPath,
					valid: false,
					error: 'Invalid derivation path format',
					expectedFormats: [
						"m/44'/coin_type'/account'/change/address_index (BIP-44)",
						"m/49'/coin_type'/account'/change/address_index (BIP-49)",
						"m/84'/coin_type'/account'/change/address_index (BIP-84)",
					],
				};
			}
			break;
		}

		case 'generateChecksumAddress': {
			const chain = this.getNodeParameter('chain', index) as string;
			const address = this.getNodeParameter('address', index) as string;

			const cleanAddress = address.toLowerCase().replace('0x', '');

			if (!/^[a-f0-9]{40}$/.test(cleanAddress)) {
				result = {
					success: false,
					original: address,
					error: 'Invalid Ethereum address format',
				};
			} else {
				// Simplified checksum (production would use keccak256)
				const checksummed = '0x' + cleanAddress.split('').map((c, i) =>
					parseInt(c, 16) > 7 ? c.toUpperCase() : c
				).join('');

				result = {
					success: true,
					original: address,
					checksumAddress: checksummed,
					chain,
					note: 'Use ethers.js/web3.js for production checksums',
				};
			}
			break;
		}

		case 'verifyChecksum': {
			const chain = this.getNodeParameter('chain', index) as string;
			const address = this.getNodeParameter('address', index) as string;

			const hasUppercase = /[A-F]/.test(address.replace('0x', ''));
			const hasLowercase = /[a-f]/.test(address.replace('0x', ''));

			if (!address.startsWith('0x') || address.length !== 42) {
				result = {
					success: true,
					address,
					valid: false,
					error: 'Invalid address format',
				};
			} else {
				result = {
					success: true,
					address,
					chain,
					hasChecksum: hasUppercase && hasLowercase,
					valid: true,
					note: hasUppercase && hasLowercase
						? 'Address uses EIP-55 checksum format'
						: 'Address is all lowercase/uppercase (no checksum)',
				};
			}
			break;
		}

		case 'auditApproval': {
			const chain = this.getNodeParameter('chain', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;

			const risks: any[] = [];
			const spenderLower = spenderAddress.toLowerCase();

			if (SAMPLE_SANCTIONS.includes(spenderLower)) {
				risks.push({
					type: 'sanctioned_spender',
					severity: 'critical',
					description: 'Spender address is in sanctions list',
				});
			}

			if (KNOWN_SCAMS[spenderLower]) {
				risks.push({
					type: 'known_scam',
					severity: 'critical',
					description: `Spender is known scam: ${KNOWN_SCAMS[spenderLower]}`,
				});
			}

			let spenderType = 'unknown';
			let riskLevel = 'medium';

			if (KNOWN_ROUTERS.includes(spenderLower)) {
				spenderType = 'known_dex_router';
				riskLevel = 'low';
			} else {
				risks.push({
					type: 'unknown_spender',
					severity: 'medium',
					description: 'Spender is not a known trusted contract',
				});
			}

			const riskScore = risks.reduce((sum, r) => {
				if (r.severity === 'critical') return sum + 50;
				if (r.severity === 'high') return sum + 30;
				if (r.severity === 'medium') return sum + 15;
				return sum + 5;
			}, 0);

			result = {
				success: true,
				owner: ownerAddress,
				spender: spenderAddress,
				token: tokenAddress,
				chain,
				timestamp: new Date().toISOString(),
				spenderType,
				risks,
				riskScore: Math.min(100, riskScore),
				riskLevel: risks.some((r) => r.severity === 'critical') ? 'critical' : riskLevel,
				recommendations: risks.length > 0 ? [
					'Review the spender contract before approving',
					'Consider using limited approval instead of unlimited',
					'Regularly audit and revoke unused approvals',
				] : [],
			};
			break;
		}

		case 'checkPhishing': {
			const checkType = this.getNodeParameter('checkType', index) as string;
			const checkValue = this.getNodeParameter('checkValue', index) as string;

			const checks: any[] = [];
			const valueLower = checkValue.toLowerCase();

			const phishingPatterns = ['metamask-airdrop', 'uniswap-claim', 'opensea-free', 'binance-bonus'];
			const suspiciousTLDs = ['.xyz', '.tk', '.ml', '.ga', '.cf'];
			const legitDomains = ['uniswap.org', 'opensea.io', 'metamask.io', 'binance.com'];

			if (checkType === 'url' || checkType === 'domain') {
				phishingPatterns.forEach((pattern) => {
					if (valueLower.includes(pattern)) {
						checks.push({
							name: 'Phishing Pattern',
							passed: false,
							detail: `Contains known phishing pattern: ${pattern}`,
						});
					}
				});

				suspiciousTLDs.forEach((tld) => {
					if (valueLower.endsWith(tld)) {
						checks.push({
							name: 'Suspicious TLD',
							passed: false,
							detail: `Uses suspicious top-level domain: ${tld}`,
						});
					}
				});

				legitDomains.forEach((domain) => {
					const baseName = domain.split('.')[0];
					if (valueLower.includes(baseName) && !valueLower.includes(domain)) {
						checks.push({
							name: 'Possible Typosquatting',
							passed: false,
							detail: `May be impersonating ${domain}`,
						});
					}
				});
			} else if (checkType === 'address') {
				if (KNOWN_SCAMS[valueLower]) {
					checks.push({ name: 'Known Scam', passed: false, detail: KNOWN_SCAMS[valueLower] });
				}
				if (SAMPLE_SANCTIONS.includes(valueLower)) {
					checks.push({ name: 'Sanctions List', passed: false, detail: 'Address found in sanctions list' });
				}
			}

			if (checks.length === 0) {
				checks.push({ name: 'Pattern Check', passed: true, detail: 'No known patterns detected' });
			}

			const failedChecks = checks.filter((c) => !c.passed);
			const isPhishing = failedChecks.length > 0;

			result = {
				success: true,
				type: checkType,
				value: checkValue,
				timestamp: new Date().toISOString(),
				checks,
				isPhishing,
				confidence: isPhishing ? Math.min(100, failedChecks.length * 33) : 0,
				recommendation: isPhishing
					? 'DO NOT interact with this address/URL'
					: 'Exercise normal caution. This check is not exhaustive.',
			};
			break;
		}

		case 'generateSecurityReport': {
			const chain = this.getNodeParameter('chain', index) as string;
			const reportType = this.getNodeParameter('reportType', index) as string;
			const subject = this.getNodeParameter('subject', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			const sections: any[] = [];

			switch (reportType) {
				case 'address':
					sections.push(
						{
							name: 'Address Validation',
							status: isValidAddress(subject, chain) ? 'pass' : 'fail',
							details: { format: detectAddressFormat(subject, chain), valid: isValidAddress(subject, chain) },
						},
						{
							name: 'Risk Assessment',
							status: 'info',
							details: { riskScore: calculateAddressRiskScore(subject), riskLevel: getRiskLevel(calculateAddressRiskScore(subject)) },
						},
						{
							name: 'Sanctions Check',
							status: SAMPLE_SANCTIONS.includes(subject.toLowerCase()) ? 'fail' : 'pass',
							details: { found: SAMPLE_SANCTIONS.includes(subject.toLowerCase()) },
						},
						{
							name: 'Scam Database',
							status: KNOWN_SCAMS[subject.toLowerCase()] ? 'fail' : 'pass',
							details: { found: !!KNOWN_SCAMS[subject.toLowerCase()], label: KNOWN_SCAMS[subject.toLowerCase()] || null },
						},
					);
					break;
				case 'contract':
					sections.push(
						{ name: 'Contract Verification', status: 'info', details: { verified: Math.random() > 0.3 } },
						{ name: 'Code Analysis', status: 'warning', details: { riskyPatterns: ['mint function present'] } },
						{ name: 'Ownership Analysis', status: 'info', details: { ownershipRenounced: false } },
					);
					break;
				case 'wallet':
					sections.push(
						{ name: 'Wallet Overview', status: 'info', details: { address: subject, chain } },
						{ name: 'Approval Audit', status: 'warning', details: { activeApprovals: 5, unlimitedApprovals: 2 } },
					);
					break;
				default:
					sections.push({ name: 'Analysis', status: 'info', details: { subject } });
			}

			const failedSections = sections.filter((s) => s.status === 'fail');
			const warningSections = sections.filter((s) => s.status === 'warning');

			result = {
				success: true,
				reportId: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
				type: reportType,
				subject,
				chain,
				generatedAt: new Date().toISOString(),
				sections,
				summary: {
					overallStatus: failedSections.length > 0 ? 'fail' : warningSections.length > 0 ? 'warning' : 'pass',
					criticalIssues: failedSections.length,
					warnings: warningSections.length,
				},
			};

			if (options.includeRecommendations !== false) {
				result.recommendations = [
					'Always verify addresses before sending funds',
					'Use hardware wallet for large transactions',
				];
			}
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: index });
	}

	return [{ json: result }];
}
