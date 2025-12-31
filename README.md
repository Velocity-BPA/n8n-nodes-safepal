# n8n-nodes-safepal

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for SafePal hardware wallet integration, enabling secure cryptocurrency operations across 54+ blockchains with air-gapped signing support. Includes QR code workflows, Bluetooth connectivity, WalletConnect v2, and advanced security tools.

![n8n](https://img.shields.io/badge/n8n-community--node-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **Air-Gapped Security**: QR code and Bluetooth communication with SafePal hardware wallets
- **Multi-Chain Support**: Bitcoin, Ethereum, Solana, Cosmos, and 54+ blockchain networks
- **Transaction Building**: Create and sign transactions without exposing private keys
- **Token Management**: ERC20, SPL, TRC20, and native token operations
- **WalletConnect v2**: Connect to dApps through WalletConnect protocol
- **Security Tools**: Address verification, risk assessment, and audit operations
- **Trigger Support**: Real-time blockchain event monitoring

## Installation

### Community Nodes (Recommended)

1. In n8n, go to **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-safepal`
4. Accept the risks and click **Install**

### Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-safepal
```

### Development Installation

```bash
# 1. Extract the zip file
unzip n8n-nodes-safepal.zip
cd n8n-nodes-safepal

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Create symlink to n8n custom nodes directory
# For Linux/macOS:
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-safepal

# For Windows (run as Administrator):
# mklink /D %USERPROFILE%\.n8n\custom\n8n-nodes-safepal %CD%

# 5. Restart n8n
n8n start
```

## Credentials Setup

### SafePal Device Credentials

For hardware wallet operations:

| Field | Description |
|-------|-------------|
| Device Type | Select your SafePal model (S1, S1 Pro, X1, X1 Pro) |
| Connection Mode | QR Code or Bluetooth |
| Pairing Key | Optional Bluetooth pairing key |

### SafePal Network Credentials

For blockchain RPC connections:

| Field | Description |
|-------|-------------|
| Ethereum RPC URL | Your Ethereum node URL |
| BSC RPC URL | Binance Smart Chain node URL |
| Polygon RPC URL | Polygon network node URL |
| Solana RPC URL | Solana cluster URL |
| Additional Networks | Configure as needed |

### SafePal App Credentials

For SafePal mobile app integration:

| Field | Description |
|-------|-------------|
| API Key | Your SafePal API key |
| API Secret | Your SafePal API secret |

## Resources & Operations

### Device & Connection (3 Resources)

#### device
| Operation | Description |
|-----------|-------------|
| getInfo | Get device information |
| listModels | List supported device models |
| checkCompatibility | Check operation compatibility |
| getCapabilities | Get device capabilities |
| verifyConnection | Verify device connection |
| getFirmwareInfo | Get firmware information |

#### qrCode
| Operation | Description |
|-----------|-------------|
| generateAddress | Generate address QR code |
| generateTransaction | Generate transaction QR code |
| generateMessage | Generate message QR code |
| parse | Parse QR code data |
| generateAnimated | Generate animated QR sequence |
| parseAnimated | Parse animated QR sequence |

#### bluetooth
| Operation | Description |
|-----------|-------------|
| scan | Scan for devices |
| connect | Connect to device |
| disconnect | Disconnect from device |
| getStatus | Get connection status |
| sendCommand | Send command to device |
| receiveData | Receive data from device |

### Account Management (1 Resource)

#### account
| Operation | Description |
|-----------|-------------|
| derive | Derive account from path |
| getAddress | Get account address |
| getPublicKey | Get public key |
| validatePath | Validate derivation path |
| getAccounts | List all accounts |
| getBalance | Get account balance |

### Blockchain Operations (12 Resources)

#### bitcoin
| Operation | Description |
|-----------|-------------|
| getBalance | Get BTC balance |
| getUtxos | Get unspent outputs |
| buildTransaction | Build transaction |
| estimateFee | Estimate transaction fee |
| validateAddress | Validate address |
| parseAddress | Parse address format |

#### ethereum
| Operation | Description |
|-----------|-------------|
| getBalance | Get ETH balance |
| getTransactionCount | Get nonce |
| buildTransaction | Build transaction |
| estimateGas | Estimate gas |
| getGasPrice | Get gas price |
| call | Call contract method |
| getLogs | Get event logs |

#### evmChains
Supports: Ethereum, BSC, Polygon, Avalanche, Fantom, Arbitrum, Optimism, Base, zkSync, Cronos, Gnosis, Celo, Moonbeam, Moonriver

| Operation | Description |
|-----------|-------------|
| getBalance | Get native balance |
| getTransactionCount | Get nonce |
| buildTransaction | Build transaction |
| estimateGas | Estimate gas |
| getGasPrice | Get gas price |
| call | Call contract method |

#### solana
| Operation | Description |
|-----------|-------------|
| getBalance | Get SOL balance |
| getTokenAccounts | Get SPL token accounts |
| buildTransfer | Build transfer |
| buildTokenTransfer | Build SPL transfer |
| getRecentBlockhash | Get blockhash |
| getTransaction | Get transaction details |

#### cosmos
| Operation | Description |
|-----------|-------------|
| getBalance | Get ATOM balance |
| getAccount | Get account info |
| buildSend | Build send transaction |
| buildDelegate | Build delegation |
| buildUndelegate | Build undelegation |
| getValidators | Get validators |

#### tron
| Operation | Description |
|-----------|-------------|
| getBalance | Get TRX balance |
| getAccount | Get account info |
| buildTransfer | Build TRX transfer |
| buildTrc20Transfer | Build TRC20 transfer |
| triggerContract | Trigger contract |

#### polkadot
| Operation | Description |
|-----------|-------------|
| getBalance | Get DOT balance |
| buildTransfer | Build transfer |
| buildStake | Build staking |
| buildUnstake | Build unstaking |

#### near
| Operation | Description |
|-----------|-------------|
| getBalance | Get NEAR balance |
| getAccount | Get account info |
| buildTransfer | Build transfer |
| buildFunctionCall | Build function call |

#### aptos
| Operation | Description |
|-----------|-------------|
| getBalance | Get APT balance |
| getAccount | Get account info |
| buildTransfer | Build transfer |
| buildEntryFunction | Build entry function |
| simulateTransaction | Simulate transaction |

#### sui
| Operation | Description |
|-----------|-------------|
| getBalance | Get SUI balance |
| getObjects | Get owned objects |
| buildTransfer | Build transfer |
| buildMoveCall | Build Move call |
| dryRun | Dry run transaction |

#### xrp
| Operation | Description |
|-----------|-------------|
| getBalance | Get XRP balance |
| getAccountInfo | Get account info |
| buildPayment | Build payment |
| buildTrustSet | Build trustline |
| getServerInfo | Get server info |

#### cardano
| Operation | Description |
|-----------|-------------|
| getBalance | Get ADA balance |
| getUtxos | Get UTXOs |
| buildTransaction | Build transaction |
| buildStakeRegistration | Build stake registration |
| buildDelegation | Build delegation |

#### multiChain
| Operation | Description |
|-----------|-------------|
| getBalances | Get balances across chains |
| validateAddresses | Validate addresses |
| convertAddress | Convert address format |
| buildBatchTransfers | Build multiple transfers |
| getPortfolio | Get portfolio summary |

### Token & Transaction (2 Resources)

#### token
| Operation | Description |
|-----------|-------------|
| getBalance | Get token balance |
| getInfo | Get token info |
| buildTransfer | Build transfer |
| buildApprove | Build approval |
| getAllowance | Get allowance |
| getTokenList | Get token list |
| addCustomToken | Add custom token |

#### transaction
| Operation | Description |
|-----------|-------------|
| build | Build transaction |
| parse | Parse transaction |
| serialize | Serialize transaction |
| deserialize | Deserialize transaction |
| decode | Decode transaction |
| simulate | Simulate transaction |
| getStatus | Get transaction status |
| getReceipt | Get transaction receipt |
| estimateFee | Estimate fee |

### Signing (1 Resource)

#### signing
| Operation | Description |
|-----------|-------------|
| signMessage | Sign personal message |
| signTypedData | Sign EIP-712 data |
| signTransaction | Sign transaction |
| verifySignature | Verify signature |
| hashMessage | Hash message |
| recoverSigner | Recover signer |

### DApp Integration (2 Resources)

#### dapp
| Operation | Description |
|-----------|-------------|
| connect | Connect to dApp |
| disconnect | Disconnect |
| getSession | Get session info |
| approveRequest | Approve request |
| rejectRequest | Reject request |
| sendRequest | Send request |
| handleCallback | Handle callback |

#### walletConnect
| Operation | Description |
|-----------|-------------|
| pair | Pair with URI |
| approve | Approve session |
| reject | Reject session |
| disconnect | Disconnect session |
| getSessions | Get active sessions |
| sendRequest | Send request |
| respondRequest | Respond to request |

### SafePal App (1 Resource)

#### safePalApp
| Operation | Description |
|-----------|-------------|
| getWallets | Get wallets |
| getAccounts | Get accounts |
| requestSignature | Request signature |
| getTransactionHistory | Get history |
| syncWallet | Sync wallet |
| exportData | Export data |
| importData | Import data |

### Security & Utility (2 Resources)

#### security
| Operation | Description |
|-----------|-------------|
| verifyAddress | Verify address format |
| checkAddressRisk | Check address risk |
| verifyContract | Verify contract safety |
| analyzeTransaction | Analyze transaction |
| checkTokenSafety | Check token safety |
| validateDerivationPath | Validate BIP path |
| generateChecksumAddress | Generate checksum |
| verifyChecksum | Verify checksum |
| auditApproval | Audit token approval |
| checkPhishing | Check for phishing |
| generateSecurityReport | Generate report |

#### utility
| Operation | Description |
|-----------|-------------|
| encodeHex | Encode to hex |
| decodeHex | Decode from hex |
| encodeBase58 | Encode to Base58 |
| decodeBase58 | Decode from Base58 |
| encodeBase64 | Encode to Base64 |
| decodeBase64 | Decode from Base64 |
| hashData | Hash data |
| convertUnits | Convert units |
| formatAddress | Format address |
| parseAmount | Parse amount |
| formatAmount | Format amount |
| generateRandom | Generate random |
| padHex | Pad hex value |
| calculateGasCost | Calculate gas cost |

## Trigger Node

### SafePal Trigger

Monitor blockchain events in real-time.

| Event | Description |
|-------|-------------|
| transaction_received | Incoming transactions |
| transaction_sent | Outgoing transactions |
| transaction_confirmed | Transaction confirmations |
| token_transfer | Token transfers |
| balance_changed | Balance changes |
| new_block | New blocks |
| contract_event | Contract events |
| approval_event | Token approvals |

## Usage Examples

### Secure Transaction Signing

```
[Manual Trigger] → [Build Transaction] → [Generate QR] → [Wait for Signature] → [Parse QR] → [Broadcast]
```

### Multi-Chain Portfolio

```
[Schedule] → [Get Balances] → [multiChain.getPortfolio] → [Format] → [Send Email]
```

### Token Approval Monitor

```
[SafePal Trigger: approval_event] → [security.auditApproval] → [IF risk > high] → [Notify]
```

### Address Verification

```
[Webhook] → [security.verifyAddress] → [security.checkAddressRisk] → [Respond]
```

## Blockchain Networks

### EVM Networks
| Network | Chain ID | Symbol |
|---------|----------|--------|
| Ethereum | 1 | ETH |
| BNB Smart Chain | 56 | BNB |
| Polygon | 137 | MATIC |
| Avalanche C-Chain | 43114 | AVAX |
| Fantom | 250 | FTM |
| Arbitrum One | 42161 | ETH |
| Optimism | 10 | ETH |
| Base | 8453 | ETH |
| zkSync Era | 324 | ETH |
| Cronos | 25 | CRO |
| Gnosis | 100 | xDAI |
| Celo | 42220 | CELO |
| Moonbeam | 1284 | GLMR |
| Moonriver | 1285 | MOVR |

### Non-EVM Networks
| Network | Symbol | Type |
|---------|--------|------|
| Bitcoin | BTC | UTXO |
| Solana | SOL | Account |
| Cosmos | ATOM | Cosmos SDK |
| Tron | TRX | Account |
| Polkadot | DOT | Substrate |
| NEAR | NEAR | Account |
| Aptos | APT | Move |
| Sui | SUI | Move |
| XRP Ledger | XRP | Account |
| Cardano | ADA | UTXO |

## Error Handling

The node provides comprehensive error handling:

- **InvalidAddressError**: Invalid blockchain address format
- **InsufficientBalanceError**: Not enough funds for transaction
- **NetworkError**: RPC or network connection issues
- **DeviceNotConnectedError**: Hardware wallet not connected
- **SignatureRejectedError**: User rejected signing
- **TimeoutError**: Operation timed out

## Security Best Practices

1. **Never expose private keys**: Use air-gapped signing with QR codes
2. **Verify all addresses**: Use security.verifyAddress before transactions
3. **Check contract safety**: Use security.verifyContract for smart contracts
4. **Monitor approvals**: Use security.auditApproval for token approvals
5. **Use confirmations**: Wait for multiple confirmations for large amounts
6. **Validate derivation paths**: Use security.validateDerivationPath

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-safepal/issues)
- **Email**: licensing@velobpa.com
- **Website**: [velobpa.com](https://velobpa.com)

## Acknowledgments

- [SafePal](https://safepal.io) for hardware wallet technology
- [n8n](https://n8n.io) for the workflow automation platform
- [ethers.js](https://ethers.org) for Ethereum utilities
