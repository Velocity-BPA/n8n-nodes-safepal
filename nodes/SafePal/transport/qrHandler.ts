/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal QR Code Handler
 *
 * Handles QR code generation and parsing for air-gapped communication
 * with SafePal S1, S1 Pro, and X1 devices.
 */

import {
  generateQrCode,
  generateQrCodeSvg,
  generateQrCodeBuffer,
  generateAnimatedQrCodes,
  splitIntoAnimatedFrames,
  mergeAnimatedFrames,
  encodeSafePalQrData,
  decodeSafePalQrData,
  validateQrFormat,
  requiresAnimatedQr,
  type QrGenerationOptions,
  type AnimatedQrFrame,
  type SafePalQrData,
} from '../utils/qrUtils';
import {
  QR_DATA_TYPES,
  type QrImageFormat,
} from '../constants/qrFormats';

/**
 * QR handler configuration
 */
export interface QrHandlerConfig {
  defaultSize?: number;
  defaultErrorCorrection?: 'L' | 'M' | 'Q' | 'H';
  maxStaticDataSize?: number;
  animatedFrameSize?: number;
  animatedFrameDuration?: number;
}

/**
 * QR generation result
 */
export interface QrGenerationResult {
  success: boolean;
  type: 'static' | 'animated';
  data?: string | string[];
  frameCount?: number;
  error?: string;
}

/**
 * QR parse result
 */
export interface QrParseResult {
  success: boolean;
  data?: SafePalQrData;
  error?: string;
}

/**
 * SafePal QR Handler class
 */
export class QrHandler {
  private config: QrHandlerConfig;

  constructor(config: QrHandlerConfig = {}) {
    this.config = {
      defaultSize: config.defaultSize ?? 300,
      defaultErrorCorrection: config.defaultErrorCorrection ?? 'M',
      maxStaticDataSize: config.maxStaticDataSize ?? 2000,
      animatedFrameSize: config.animatedFrameSize ?? 500,
      animatedFrameDuration: config.animatedFrameDuration ?? 200,
    };
  }

  /**
   * Generate QR code for unsigned transaction
   * @param chainOrData - Either chain string or object with transaction data
   * @param transactionData - Transaction data string (if first arg is chain)
   * @param options - QR generation options
   */
  async generateTransactionQr(
    chainOrData: string | Record<string, unknown>,
    transactionData?: string | QrGenerationOptions,
    options?: QrGenerationOptions,
  ): Promise<QrGenerationResult> {
    let chain: string;
    let data: string;
    let opts: QrGenerationOptions | undefined;

    if (typeof chainOrData === 'object') {
      // Object-based call: generateTransactionQr({ chain, ... })
      chain = (chainOrData.chain as string) || 'unknown';
      data = JSON.stringify(chainOrData);
      opts = transactionData as QrGenerationOptions;
    } else {
      // String-based call: generateTransactionQr(chain, txData, options)
      chain = chainOrData;
      data = (transactionData as string) || '';
      opts = options;
    }

    const payload = encodeSafePalQrData(QR_DATA_TYPES.UNSIGNED_TX, chain, data);

    if (requiresAnimatedQr(payload, this.config.maxStaticDataSize)) {
      return this.generateAnimated(payload, opts);
    }

    return this.generateStatic(payload, opts);
  }

  /**
   * Generate QR code for message signing
   */
  async generateMessageQr(
    chainOrData: string | Record<string, unknown>,
    message?: string | QrGenerationOptions,
    options?: QrGenerationOptions,
  ): Promise<QrGenerationResult> {
    let chain: string;
    let data: string;
    let opts: QrGenerationOptions | undefined;

    if (typeof chainOrData === 'object') {
      chain = (chainOrData.chain as string) || 'unknown';
      data = (chainOrData.message as string) || JSON.stringify(chainOrData);
      opts = message as QrGenerationOptions;
    } else {
      chain = chainOrData;
      data = (message as string) || '';
      opts = options;
    }

    const payload = encodeSafePalQrData(QR_DATA_TYPES.MESSAGE, chain, data);
    return this.generateStatic(payload, opts);
  }

  /**
   * Generate QR code for typed data signing (EIP-712)
   */
  async generateTypedDataQr(
    chainOrData: string | Record<string, unknown>,
    typedData?: string | QrGenerationOptions,
    options?: QrGenerationOptions,
  ): Promise<QrGenerationResult> {
    let chain: string;
    let data: string;
    let opts: QrGenerationOptions | undefined;

    if (typeof chainOrData === 'object') {
      chain = (chainOrData.chain as string) || 'unknown';
      data = (chainOrData.typedData as string) || JSON.stringify(chainOrData);
      opts = typedData as QrGenerationOptions;
    } else {
      chain = chainOrData;
      data = (typedData as string) || '';
      opts = options;
    }

    const payload = encodeSafePalQrData(QR_DATA_TYPES.TYPED_DATA, chain, data);

    if (requiresAnimatedQr(payload, this.config.maxStaticDataSize)) {
      return this.generateAnimated(payload, opts);
    }

    return this.generateStatic(payload, opts);
  }

  /**
   * Generate QR code for account sync
   * @param chainOrData - Either chain string or object with sync data
   * @param syncData - Sync data string (if first arg is chain)
   * @param options - QR generation options
   */
  async generateSyncQr(
    chainOrData: string | Record<string, unknown>,
    syncData?: string | QrGenerationOptions,
    options?: QrGenerationOptions,
  ): Promise<QrGenerationResult> {
    let chain: string;
    let data: string;
    let opts: QrGenerationOptions | undefined;

    if (typeof chainOrData === 'object') {
      // Object-based call: generateSyncQr({ chain, ... })
      chain = (chainOrData.chain as string) || 'unknown';
      data = JSON.stringify(chainOrData);
      opts = syncData as QrGenerationOptions;
    } else {
      // String-based call: generateSyncQr(chain, syncData, options)
      chain = chainOrData;
      data = (syncData as string) || '';
      opts = options;
    }

    const payload = encodeSafePalQrData(QR_DATA_TYPES.SYNC_DATA, chain, data);

    if (requiresAnimatedQr(payload, this.config.maxStaticDataSize)) {
      return this.generateAnimated(payload, opts);
    }

    return this.generateStatic(payload, opts);
  }

  /**
   * Generate static QR code
   */
  async generateStatic(
    data: string,
    options?: QrGenerationOptions,
  ): Promise<QrGenerationResult> {
    try {
      const mergedOptions: QrGenerationOptions = {
        width: this.config.defaultSize,
        errorCorrectionLevel: this.config.defaultErrorCorrection,
        ...options,
      };

      const qrCode = await generateQrCode(data, mergedOptions);

      return {
        success: true,
        type: 'static',
        data: qrCode,
        frameCount: 1,
      };
    } catch (error) {
      return {
        success: false,
        type: 'static',
        error: error instanceof Error ? error.message : 'Failed to generate QR code',
      };
    }
  }

  /**
   * Generate animated QR code (multiple frames)
   */
  async generateAnimated(
    data: string,
    options?: QrGenerationOptions,
  ): Promise<QrGenerationResult> {
    try {
      const mergedOptions: QrGenerationOptions = {
        width: this.config.defaultSize,
        errorCorrectionLevel: this.config.defaultErrorCorrection,
        ...options,
      };

      const qrCodes = await generateAnimatedQrCodes(
        data,
        mergedOptions,
        this.config.animatedFrameSize,
      );

      return {
        success: true,
        type: 'animated',
        data: qrCodes,
        frameCount: qrCodes.length,
      };
    } catch (error) {
      return {
        success: false,
        type: 'animated',
        error: error instanceof Error ? error.message : 'Failed to generate animated QR code',
      };
    }
  }

  /**
   * Generate QR in different formats
   */
  async generateInFormat(
    data: string,
    format: QrImageFormat,
    options?: QrGenerationOptions,
  ): Promise<string | Buffer> {
    const mergedOptions: QrGenerationOptions = {
      width: this.config.defaultSize,
      errorCorrectionLevel: this.config.defaultErrorCorrection,
      ...options,
    };

    switch (format) {
      case 'svg':
        return generateQrCodeSvg(data, mergedOptions);
      case 'png':
        return generateQrCodeBuffer(data, mergedOptions);
      case 'base64':
        const buffer = await generateQrCodeBuffer(data, mergedOptions);
        return buffer.toString('base64');
      case 'dataUrl':
      default:
        return generateQrCode(data, mergedOptions);
    }
  }

  /**
   * Parse QR code data
   */
  parseQrData(qrData: string): QrParseResult {
    const validation = validateQrFormat(qrData);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    try {
      const data = decodeSafePalQrData(qrData);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse QR data',
      };
    }
  }

  /**
   * Parse signature QR from device
   */
  parseSignatureQr(qrData: string): {
    success: boolean;
    signature?: string;
    chain?: string;
    error?: string;
  } {
    const result = this.parseQrData(qrData);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error ?? 'Failed to parse signature QR',
      };
    }

    if (result.data.type !== QR_DATA_TYPES.SIGNATURE && result.data.type !== QR_DATA_TYPES.SIGNED_TX) {
      return {
        success: false,
        error: `Expected signature QR, got ${result.data.type}`,
      };
    }

    return {
      success: true,
      signature: result.data.payload,
      chain: result.data.chain,
    };
  }

  /**
   * Split data into animated frames
   */
  splitToFrames(data: string): AnimatedQrFrame[] {
    return splitIntoAnimatedFrames(data, this.config.animatedFrameSize);
  }

  /**
   * Merge animated frames back to data
   */
  mergeFrames(frames: AnimatedQrFrame[]): string {
    return mergeAnimatedFrames(frames);
  }

  /**
   * Validate QR data format
   */
  validate(qrData: string): { valid: boolean; error?: string } {
    return validateQrFormat(qrData);
  }

  /**
   * Check if data requires animated QR
   */
  needsAnimatedQr(data: string): boolean {
    return requiresAnimatedQr(data, this.config.maxStaticDataSize);
  }

  /**
   * Get estimated frame count for data
   */
  getEstimatedFrameCount(dataSize: number): number {
    if (dataSize <= (this.config.maxStaticDataSize ?? 2000)) {
      return 1;
    }
    return Math.ceil(dataSize / (this.config.animatedFrameSize ?? 500));
  }

  /**
   * Get configuration
   */
  getConfig(): QrHandlerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QrHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create QR handler with default configuration
 */
export function createQrHandler(config?: QrHandlerConfig): QrHandler {
  return new QrHandler(config);
}

/**
 * Export singleton instance for convenience
 */
export const defaultQrHandler = new QrHandler();
