/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal QR Code Utilities
 *
 * Functions for generating, parsing, and validating QR codes
 * used in SafePal air-gapped communication.
 */

import * as QRCode from 'qrcode';
import {
  QR_ERROR_CORRECTION,
  QR_VERSION_LIMITS,
  ANIMATED_QR_CONFIG,
  SAFEPAL_QR_HEADER,
  type QrErrorCorrection,
  type QrEncoding,
  type QrDataType,
} from '../constants/qrFormats';

/**
 * QR generation options
 */
export interface QrGenerationOptions {
  errorCorrectionLevel?: QrErrorCorrection;
  version?: number;
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Animated QR frame
 */
export interface AnimatedQrFrame {
  index: number;
  total: number;
  data: string;
  checksum: string;
}

/**
 * SafePal QR data structure
 */
export interface SafePalQrData {
  version: number;
  type: QrDataType;
  chain: string;
  payload: string;
  checksum: string;
}

/**
 * Generate a static QR code as data URL
 */
export async function generateQrCode(
  data: string,
  options: QrGenerationOptions = {},
): Promise<string> {
  const qrOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel ?? QR_ERROR_CORRECTION.MEDIUM,
    version: options.version ?? QR_VERSION_LIMITS.DEFAULT_VERSION,
    width: options.width ?? 300,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark ?? '#000000',
      light: options.color?.light ?? '#ffffff',
    },
  };

  return QRCode.toDataURL(data, qrOptions);
}

/**
 * Generate QR code as SVG string
 */
export async function generateQrCodeSvg(
  data: string,
  options: QrGenerationOptions = {},
): Promise<string> {
  const qrOptions: QRCode.QRCodeToStringOptions = {
    type: 'svg',
    errorCorrectionLevel: options.errorCorrectionLevel ?? QR_ERROR_CORRECTION.MEDIUM,
    width: options.width ?? 300,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark ?? '#000000',
      light: options.color?.light ?? '#ffffff',
    },
  };

  return QRCode.toString(data, qrOptions);
}

/**
 * Generate QR code as PNG buffer
 */
export async function generateQrCodeBuffer(
  data: string,
  options: QrGenerationOptions = {},
): Promise<Buffer> {
  const qrOptions: QRCode.QRCodeToBufferOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel ?? QR_ERROR_CORRECTION.MEDIUM,
    version: options.version ?? QR_VERSION_LIMITS.DEFAULT_VERSION,
    width: options.width ?? 300,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark ?? '#000000',
      light: options.color?.light ?? '#ffffff',
    },
  };

  return QRCode.toBuffer(data, qrOptions);
}

/**
 * Split large data into animated QR frames
 */
export function splitIntoAnimatedFrames(
  data: string,
  maxFrameSize: number = 500,
): AnimatedQrFrame[] {
  const frames: AnimatedQrFrame[] = [];
  const totalFrames = Math.ceil(data.length / maxFrameSize);

  for (let i = 0; i < totalFrames; i++) {
    const start = i * maxFrameSize;
    const end = Math.min(start + maxFrameSize, data.length);
    const frameData = data.slice(start, end);
    const checksum = calculateChecksum(frameData);

    frames.push({
      index: i,
      total: totalFrames,
      data: frameData,
      checksum,
    });
  }

  return frames;
}

/**
 * Merge animated QR frames back into complete data
 */
export function mergeAnimatedFrames(frames: AnimatedQrFrame[]): string {
  // Sort frames by index
  const sortedFrames = [...frames].sort((a, b) => a.index - b.index);

  // Validate frame sequence
  const expectedTotal = sortedFrames[0]?.total ?? 0;
  if (sortedFrames.length !== expectedTotal) {
    throw new Error(`Missing frames: expected ${expectedTotal}, got ${sortedFrames.length}`);
  }

  // Validate checksums and merge
  let result = '';
  for (const frame of sortedFrames) {
    if (frame.total !== expectedTotal) {
      throw new Error(`Frame total mismatch at index ${frame.index}`);
    }

    const calculatedChecksum = calculateChecksum(frame.data);
    if (calculatedChecksum !== frame.checksum) {
      throw new Error(`Checksum mismatch at frame ${frame.index}`);
    }

    result += frame.data;
  }

  return result;
}

/**
 * Calculate simple checksum for data integrity
 */
export function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Encode SafePal QR data
 */
export function encodeSafePalQrData(
  type: QrDataType,
  chain: string,
  payload: string,
): string {
  const data: SafePalQrData = {
    version: SAFEPAL_QR_HEADER.VERSION,
    type,
    chain,
    payload,
    checksum: calculateChecksum(payload),
  };

  return `${SAFEPAL_QR_HEADER.MAGIC}${JSON.stringify(data)}`;
}

/**
 * Decode SafePal QR data
 */
export function decodeSafePalQrData(qrData: string): SafePalQrData {
  if (!qrData.startsWith(SAFEPAL_QR_HEADER.MAGIC)) {
    throw new Error('Invalid SafePal QR code format');
  }

  const jsonStr = qrData.slice(SAFEPAL_QR_HEADER.MAGIC.length);

  try {
    const data = JSON.parse(jsonStr) as SafePalQrData;

    // Validate checksum
    const calculatedChecksum = calculateChecksum(data.payload);
    if (calculatedChecksum !== data.checksum) {
      throw new Error('QR data checksum verification failed');
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid SafePal QR code JSON');
    }
    throw error;
  }
}

/**
 * Validate QR data format
 */
export function validateQrFormat(data: string): {
  valid: boolean;
  error?: string;
} {
  if (!data || data.length === 0) {
    return { valid: false, error: 'Empty QR data' };
  }

  if (!data.startsWith(SAFEPAL_QR_HEADER.MAGIC)) {
    return { valid: false, error: 'Missing SafePal header' };
  }

  try {
    const jsonStr = data.slice(SAFEPAL_QR_HEADER.MAGIC.length);
    const parsed = JSON.parse(jsonStr) as SafePalQrData;

    if (!parsed.version || !parsed.type || !parsed.chain || !parsed.payload) {
      return { valid: false, error: 'Missing required fields' };
    }

    const calculatedChecksum = calculateChecksum(parsed.payload);
    if (calculatedChecksum !== parsed.checksum) {
      return { valid: false, error: 'Checksum mismatch' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid JSON structure' };
  }
}

/**
 * Encode data with specified encoding
 */
export function encodeData(data: string, encoding: QrEncoding): string {
  switch (encoding) {
    case 'base64':
      return Buffer.from(data).toString('base64');
    case 'hex':
      return Buffer.from(data).toString('hex');
    case 'utf8':
    default:
      return data;
  }
}

/**
 * Decode data from specified encoding
 */
export function decodeData(data: string, encoding: QrEncoding): string {
  switch (encoding) {
    case 'base64':
      return Buffer.from(data, 'base64').toString('utf8');
    case 'hex':
      return Buffer.from(data, 'hex').toString('utf8');
    case 'utf8':
    default:
      return data;
  }
}

/**
 * Generate animated QR codes as array of data URLs
 */
export async function generateAnimatedQrCodes(
  data: string,
  options: QrGenerationOptions = {},
  maxFrameSize: number = 500,
): Promise<string[]> {
  const frames = splitIntoAnimatedFrames(data, maxFrameSize);
  const qrCodes: string[] = [];

  for (const frame of frames) {
    const frameData = JSON.stringify({
      i: frame.index,
      t: frame.total,
      d: frame.data,
      c: frame.checksum,
    });
    const qrCode = await generateQrCode(frameData, options);
    qrCodes.push(qrCode);
  }

  return qrCodes;
}

/**
 * Check if data requires animated QR
 */
export function requiresAnimatedQr(data: string, maxStaticSize: number = 2000): boolean {
  return data.length > maxStaticSize;
}

/**
 * Get recommended frame count for data size
 */
export function getRecommendedFrameCount(dataSize: number, frameSize: number = 500): number {
  const count = Math.ceil(dataSize / frameSize);
  return Math.min(count, ANIMATED_QR_CONFIG.MAX_FRAMES);
}
