/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * SafePal QR Code Format Constants
 *
 * Configurations for QR code encoding and handling in SafePal workflows.
 */

/**
 * QR code types supported by SafePal
 */
export const QR_TYPES = {
  STATIC: 'static',
  ANIMATED: 'animated',
} as const;

export type QrType = (typeof QR_TYPES)[keyof typeof QR_TYPES];

/**
 * QR encoding formats
 */
export const QR_ENCODINGS = {
  UTF8: 'utf8',
  BASE64: 'base64',
  HEX: 'hex',
  CBOR: 'cbor',
} as const;

export type QrEncoding = (typeof QR_ENCODINGS)[keyof typeof QR_ENCODINGS];

/**
 * QR data types for SafePal communication
 */
export const QR_DATA_TYPES = {
  UNSIGNED_TX: 'unsigned_tx',
  SIGNED_TX: 'signed_tx',
  SIGNATURE: 'signature',
  ADDRESS: 'address',
  XPUB: 'xpub',
  MESSAGE: 'message',
  TYPED_DATA: 'typed_data',
  ACCOUNT_INFO: 'account_info',
  SYNC_DATA: 'sync_data',
} as const;

export type QrDataType = (typeof QR_DATA_TYPES)[keyof typeof QR_DATA_TYPES];

/**
 * QR code version limits
 */
export const QR_VERSION_LIMITS = {
  MIN_VERSION: 1,
  MAX_VERSION: 40,
  DEFAULT_VERSION: 10,
} as const;

/**
 * QR code error correction levels
 */
export const QR_ERROR_CORRECTION = {
  LOW: 'L',
  MEDIUM: 'M',
  QUARTILE: 'Q',
  HIGH: 'H',
} as const;

export type QrErrorCorrection =
  (typeof QR_ERROR_CORRECTION)[keyof typeof QR_ERROR_CORRECTION];

/**
 * Maximum data capacity per QR version (bytes, error correction M)
 */
export const QR_DATA_CAPACITY: Record<number, number> = {
  1: 14,
  5: 84,
  10: 213,
  15: 412,
  20: 666,
  25: 958,
  30: 1276,
  35: 1628,
  40: 2018,
};

/**
 * Animated QR configuration
 */
export const ANIMATED_QR_CONFIG = {
  DEFAULT_FRAME_DURATION: 200,
  MIN_FRAME_DURATION: 100,
  MAX_FRAME_DURATION: 1000,
  MAX_FRAMES: 100,
  MAX_FRAME_SIZE: 500,
  HEADER_SIZE: 4,
  CHECKSUM_SIZE: 4,
} as const;

/**
 * QR code image formats
 */
export const QR_IMAGE_FORMATS = {
  PNG: 'png',
  SVG: 'svg',
  BASE64: 'base64',
  DATA_URL: 'dataUrl',
} as const;

export type QrImageFormat = (typeof QR_IMAGE_FORMATS)[keyof typeof QR_IMAGE_FORMATS];

/**
 * QR code size presets
 */
export const QR_SIZE_PRESETS = {
  SMALL: 200,
  MEDIUM: 300,
  LARGE: 400,
  XLARGE: 500,
} as const;

/**
 * QR code options for n8n dropdowns
 */
export const QR_TYPE_OPTIONS = [
  { name: 'Static QR Code', value: 'static' },
  { name: 'Animated QR Code', value: 'animated' },
];

export const QR_ENCODING_OPTIONS = [
  { name: 'UTF-8', value: 'utf8' },
  { name: 'Base64', value: 'base64' },
  { name: 'Hexadecimal', value: 'hex' },
  { name: 'CBOR', value: 'cbor' },
];

export const QR_ERROR_CORRECTION_OPTIONS = [
  { name: 'Low (7%)', value: 'L' },
  { name: 'Medium (15%)', value: 'M' },
  { name: 'Quartile (25%)', value: 'Q' },
  { name: 'High (30%)', value: 'H' },
];

export const QR_IMAGE_FORMAT_OPTIONS = [
  { name: 'PNG', value: 'png' },
  { name: 'SVG', value: 'svg' },
  { name: 'Base64', value: 'base64' },
  { name: 'Data URL', value: 'dataUrl' },
];

/**
 * SafePal QR protocol header
 */
export const SAFEPAL_QR_HEADER = {
  MAGIC: 'SP',
  VERSION: 1,
  TYPE_OFFSET: 2,
  LENGTH_OFFSET: 4,
  DATA_OFFSET: 8,
} as const;

/**
 * Calculate number of frames needed for animated QR
 */
export function calculateFrameCount(dataSize: number, maxFrameSize: number): number {
  return Math.ceil(dataSize / maxFrameSize);
}

/**
 * Get QR code capacity for version
 */
export function getQrCapacity(version: number): number {
  const nearestVersion = Object.keys(QR_DATA_CAPACITY)
    .map(Number)
    .reduce((prev, curr) => (curr <= version && curr > prev ? curr : prev), 1);
  return QR_DATA_CAPACITY[nearestVersion] ?? QR_DATA_CAPACITY[1];
}

/**
 * Determine optimal QR version for data size
 */
export function getOptimalQrVersion(dataSize: number): number {
  for (const [version, capacity] of Object.entries(QR_DATA_CAPACITY)) {
    if (capacity >= dataSize) {
      return parseInt(version, 10);
    }
  }
  return QR_VERSION_LIMITS.MAX_VERSION;
}
