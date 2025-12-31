/**
 * @file Animated QR Transport Handler
 * @description Handles multi-frame QR code communication for large data payloads
 * @module n8n-nodes-safepal/transport/animatedQr
 *
 * SPDX-License-Identifier: BSL-1.1
 * Copyright (c) 2025 Velocity Business Partners LLC
 * Business Source License 1.1 - See LICENSE file for details
 * Licensed work: n8n-nodes-safepal
 * Change Date: 2029-01-01
 * Change License: GPL-3.0-or-later
 */

import {
	generateQrCode,
	generateQrCodeSvg,
	generateQrCodeBuffer,
	splitIntoAnimatedFrames,
	mergeAnimatedFrames,
	calculateChecksum,
	requiresAnimatedQr,
	getRecommendedFrameCount,
	AnimatedQrFrame,
} from '../utils/qrUtils';
import {
	ANIMATED_QR_CONFIG,
	SAFEPAL_QR_HEADER,
} from '../constants/qrFormats';

/**
 * Animated QR configuration
 */
export interface AnimatedQrConfig {
	/** Maximum bytes per frame */
	maxFrameSize: number;
	/** Frame display duration in ms */
	frameDuration: number;
	/** QR code size in pixels */
	qrSize: number;
	/** Error correction level */
	errorCorrection: 'L' | 'M' | 'Q' | 'H';
	/** Output format */
	format: 'dataUrl' | 'svg' | 'buffer';
	/** Include progress indicator */
	showProgress: boolean;
	/** Auto-loop animation */
	loop: boolean;
}

/**
 * Single frame in animated sequence
 */
export interface AnimatedFrame {
	/** Frame index (0-based) */
	index: number;
	/** Total frame count */
	total: number;
	/** Frame data */
	data: string;
	/** QR code output (format depends on config) */
	qrCode: string | Buffer;
	/** Frame checksum */
	checksum: string | number;
}

/**
 * Complete animated QR sequence
 */
export interface AnimatedQrSequence {
	/** Unique sequence ID */
	id: string;
	/** All frames */
	frames: AnimatedFrame[];
	/** Total data size */
	totalSize: number;
	/** Estimated display time in ms */
	totalDuration: number;
	/** Configuration used */
	config: AnimatedQrConfig;
	/** Timestamp */
	createdAt: string;
}

/**
 * Frame scan result
 */
export interface FrameScanResult {
	/** Whether frame was successfully scanned */
	success: boolean;
	/** Frame index */
	frameIndex: number;
	/** Total frames expected */
	totalFrames: number;
	/** Frame data */
	data?: string;
	/** Error message if failed */
	error?: string;
}

/**
 * Sequence assembly status
 */
export interface AssemblyStatus {
	/** Sequence ID */
	sequenceId: string;
	/** Total frames expected */
	totalFrames: number;
	/** Frames received */
	receivedFrames: number[];
	/** Missing frame indices */
	missingFrames: number[];
	/** Progress percentage */
	progress: number;
	/** Whether complete */
	isComplete: boolean;
	/** Assembled data (if complete) */
	data?: string;
}

/**
 * Animated QR Handler Class
 * Manages creation and parsing of multi-frame QR sequences
 */
export class AnimatedQrHandler {
	private config: AnimatedQrConfig;
	private pendingSequences: Map<string, {
		frames: Map<number, string>;
		totalFrames: number;
		startTime: number;
	}>;

	constructor(config: Partial<AnimatedQrConfig> = {}) {
		this.config = {
			maxFrameSize: ANIMATED_QR_CONFIG.MAX_FRAME_SIZE,
			frameDuration: ANIMATED_QR_CONFIG.DEFAULT_FRAME_DURATION,
			qrSize: 300,
			errorCorrection: 'M',
			format: 'dataUrl',
			showProgress: true,
			loop: true,
			...config,
		};

		this.pendingSequences = new Map();
	}

	/**
	 * Generate animated QR sequence from data
	 */
	async generateSequence(data: string, options: Partial<AnimatedQrConfig> = {}): Promise<AnimatedQrSequence> {
		const config = { ...this.config, ...options };
		const sequenceId = this.generateSequenceId();

		// Check if animated QR is needed
		if (!requiresAnimatedQr(data)) {
			// Single frame is sufficient
			const qrCode = await this.generateSingleFrame(data, config);
			return {
				id: sequenceId,
				frames: [{
					index: 0,
					total: 1,
					data,
					qrCode,
					checksum: calculateChecksum(data),
				}],
				totalSize: data.length,
				totalDuration: config.frameDuration,
				config,
				createdAt: new Date().toISOString(),
			};
		}

		// Split into frames
		const frameData = splitIntoAnimatedFrames(data, config.maxFrameSize);
		const frames: AnimatedFrame[] = [];

		for (let i = 0; i < frameData.length; i++) {
			const frame = frameData[i];
			const framePayload = this.encodeFrame(frame, i, frameData.length, sequenceId);
			const qrCode = await this.generateSingleFrame(framePayload, config);

			frames.push({
				index: i,
				total: frameData.length,
				data: frame.data,
				qrCode,
				checksum: frame.checksum,
			});
		}

		return {
			id: sequenceId,
			frames,
			totalSize: data.length,
			totalDuration: frames.length * config.frameDuration,
			config,
			createdAt: new Date().toISOString(),
		};
	}

	/**
	 * Generate transaction QR sequence
	 */
	async generateTransactionSequence(
		chainId: string,
		unsignedTx: string,
		options: Partial<AnimatedQrConfig> = {},
	): Promise<AnimatedQrSequence> {
		const payload = JSON.stringify({
			type: 'unsigned_tx',
			chain: chainId,
			data: unsignedTx,
			timestamp: Date.now(),
		});

		return this.generateSequence(this.wrapWithSafePalHeader(payload), options);
	}

	/**
	 * Generate message signing QR sequence
	 */
	async generateMessageSequence(
		chainId: string,
		message: string,
		messageType: 'personal' | 'typed_data' | 'raw',
		options: Partial<AnimatedQrConfig> = {},
	): Promise<AnimatedQrSequence> {
		const payload = JSON.stringify({
			type: messageType === 'typed_data' ? 'typed_data' : 'message',
			chain: chainId,
			data: message,
			timestamp: Date.now(),
		});

		return this.generateSequence(this.wrapWithSafePalHeader(payload), options);
	}

	/**
	 * Generate sync data QR sequence
	 */
	async generateSyncSequence(
		accounts: Array<{ chainId: string; address: string; path: string }>,
		options: Partial<AnimatedQrConfig> = {},
	): Promise<AnimatedQrSequence> {
		const payload = JSON.stringify({
			type: 'sync_data',
			accounts,
			timestamp: Date.now(),
		});

		return this.generateSequence(this.wrapWithSafePalHeader(payload), options);
	}

	/**
	 * Parse scanned frame
	 */
	parseFrame(qrData: string): FrameScanResult {
		try {
			// Try to decode SafePal frame format
			const frameInfo = this.decodeFrame(qrData);

			return {
				success: true,
				frameIndex: frameInfo.index,
				totalFrames: frameInfo.total,
				data: frameInfo.data,
			};
		} catch (error) {
			return {
				success: false,
				frameIndex: -1,
				totalFrames: -1,
				error: (error as Error).message,
			};
		}
	}

	/**
	 * Add frame to pending sequence assembly
	 */
	addFrame(sequenceId: string, frameIndex: number, totalFrames: number, data: string): AssemblyStatus {
		let sequence = this.pendingSequences.get(sequenceId);

		if (!sequence) {
			sequence = {
				frames: new Map(),
				totalFrames,
				startTime: Date.now(),
			};
			this.pendingSequences.set(sequenceId, sequence);
		}

		// Add frame if not already present
		if (!sequence.frames.has(frameIndex)) {
			sequence.frames.set(frameIndex, data);
		}

		return this.getAssemblyStatus(sequenceId);
	}

	/**
	 * Get assembly status for sequence
	 */
	getAssemblyStatus(sequenceId: string): AssemblyStatus {
		const sequence = this.pendingSequences.get(sequenceId);

		if (!sequence) {
			return {
				sequenceId,
				totalFrames: 0,
				receivedFrames: [],
				missingFrames: [],
				progress: 0,
				isComplete: false,
			};
		}

		const receivedFrames = Array.from(sequence.frames.keys()).sort((a, b) => a - b);
		const missingFrames: number[] = [];

		for (let i = 0; i < sequence.totalFrames; i++) {
			if (!sequence.frames.has(i)) {
				missingFrames.push(i);
			}
		}

		const isComplete = missingFrames.length === 0;
		const progress = (receivedFrames.length / sequence.totalFrames) * 100;

		const result: AssemblyStatus = {
			sequenceId,
			totalFrames: sequence.totalFrames,
			receivedFrames,
			missingFrames,
			progress,
			isComplete,
		};

		if (isComplete) {
			result.data = this.assembleSequence(sequenceId);
		}

		return result;
	}

	/**
	 * Assemble complete sequence
	 */
	assembleSequence(sequenceId: string): string | undefined {
		const sequence = this.pendingSequences.get(sequenceId);

		if (!sequence || sequence.frames.size !== sequence.totalFrames) {
			return undefined;
		}

		// Sort frames and concatenate
		const sortedFrames: string[] = [];
		for (let i = 0; i < sequence.totalFrames; i++) {
			const frameData = sequence.frames.get(i);
			if (!frameData) {
				return undefined;
			}
			sortedFrames.push(frameData);
		}

		// Merge frames
		const merged = mergeAnimatedFrames(
			sortedFrames.map((data, index) => ({
				index,
				total: sequence.totalFrames,
				data,
				checksum: calculateChecksum(data),
			})),
		);

		// Clean up
		this.pendingSequences.delete(sequenceId);

		return merged;
	}

	/**
	 * Clear pending sequence
	 */
	clearSequence(sequenceId: string): void {
		this.pendingSequences.delete(sequenceId);
	}

	/**
	 * Clear all pending sequences
	 */
	clearAllSequences(): void {
		this.pendingSequences.clear();
	}

	/**
	 * Get optimal frame configuration for data size
	 */
	getOptimalConfig(dataSize: number): { frameCount: number; frameDuration: number; totalTime: number } {
		const frameCount = getRecommendedFrameCount(dataSize);
		const frameDuration = this.calculateOptimalFrameDuration(frameCount);
		const totalTime = frameCount * frameDuration;

		return { frameCount, frameDuration, totalTime };
	}

	/**
	 * Generate animation HTML for display
	 */
	async generateAnimationHtml(sequence: AnimatedQrSequence): Promise<string> {
		const frameImages = sequence.frames.map((f) => f.qrCode as string);

		return `
<!DOCTYPE html>
<html>
<head>
	<title>SafePal QR Animation</title>
	<style>
		body { 
			display: flex; 
			flex-direction: column;
			align-items: center; 
			justify-content: center; 
			min-height: 100vh; 
			margin: 0;
			background: #1a1a2e;
			font-family: Arial, sans-serif;
			color: white;
		}
		.qr-container { 
			position: relative;
			background: white;
			padding: 20px;
			border-radius: 12px;
		}
		.qr-frame { 
			display: none; 
			width: ${sequence.config.qrSize}px;
			height: ${sequence.config.qrSize}px;
		}
		.qr-frame.active { display: block; }
		.progress-bar {
			width: ${sequence.config.qrSize}px;
			height: 4px;
			background: #333;
			margin-top: 20px;
			border-radius: 2px;
			overflow: hidden;
		}
		.progress-fill {
			height: 100%;
			background: #00d4aa;
			transition: width ${sequence.config.frameDuration}ms linear;
		}
		.frame-info {
			margin-top: 10px;
			font-size: 14px;
			color: #888;
		}
	</style>
</head>
<body>
	<div class="qr-container">
		${frameImages.map((img, i) => `<img class="qr-frame" id="frame-${i}" src="${img}" alt="Frame ${i + 1}">`).join('\n')}
	</div>
	${sequence.config.showProgress ? `
	<div class="progress-bar">
		<div class="progress-fill" id="progress"></div>
	</div>
	<div class="frame-info">
		Frame <span id="current">1</span> of ${sequence.frames.length}
	</div>
	` : ''}
	<script>
		const frames = ${sequence.frames.length};
		const duration = ${sequence.config.frameDuration};
		const loop = ${sequence.config.loop};
		let current = 0;
		
		function showFrame(index) {
			document.querySelectorAll('.qr-frame').forEach(f => f.classList.remove('active'));
			document.getElementById('frame-' + index).classList.add('active');
			${sequence.config.showProgress ? `
			document.getElementById('current').textContent = index + 1;
			document.getElementById('progress').style.width = ((index + 1) / frames * 100) + '%';
			` : ''}
		}
		
		function animate() {
			showFrame(current);
			current++;
			if (current >= frames) {
				if (loop) {
					current = 0;
					setTimeout(animate, duration);
				}
			} else {
				setTimeout(animate, duration);
			}
		}
		
		animate();
	</script>
</body>
</html>`;
	}

	/**
	 * Generate GIF animation (placeholder - would need gif encoder)
	 */
	async generateAnimationGif(_sequence: AnimatedQrSequence): Promise<Buffer> {
		// In a real implementation, this would use a GIF encoder library
		// to create an animated GIF from the frame sequence
		throw new Error('GIF generation requires gif-encoder library');
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<AnimatedQrConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): AnimatedQrConfig {
		return { ...this.config };
	}

	/**
	 * Generate single QR frame
	 */
	private async generateSingleFrame(data: string, config: AnimatedQrConfig): Promise<string | Buffer> {
		const options = {
			width: config.qrSize,
			errorCorrectionLevel: config.errorCorrection,
			margin: 2,
		};

		switch (config.format) {
			case 'svg':
				return generateQrCodeSvg(data, options);
			case 'buffer':
				return generateQrCodeBuffer(data, options);
			default:
				return generateQrCode(data, options);
		}
	}

	/**
	 * Encode frame with metadata
	 */
	private encodeFrame(frame: AnimatedQrFrame, index: number, total: number, sequenceId: string): string {
		const frameWrapper = {
			seq: sequenceId,
			idx: index,
			tot: total,
			chk: frame.checksum,
			dat: frame.data,
		};

		return JSON.stringify(frameWrapper);
	}

	/**
	 * Decode frame from QR data
	 */
	private decodeFrame(qrData: string): { sequenceId: string; index: number; total: number; data: string; checksum: number } {
		const parsed = JSON.parse(qrData);

		if (!parsed.seq || parsed.idx === undefined || !parsed.tot || !parsed.dat) {
			throw new Error('Invalid frame format');
		}

		return {
			sequenceId: parsed.seq,
			index: parsed.idx,
			total: parsed.tot,
			data: parsed.dat,
			checksum: parsed.chk || 0,
		};
	}

	/**
	 * Wrap payload with SafePal header
	 */
	private wrapWithSafePalHeader(payload: string): string {
		return JSON.stringify({
			magic: SAFEPAL_QR_HEADER.MAGIC,
			version: SAFEPAL_QR_HEADER.VERSION,
			payload: JSON.parse(payload),
			checksum: calculateChecksum(payload),
		});
	}

	/**
	 * Generate unique sequence ID
	 */
	private generateSequenceId(): string {
		return `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	}

	/**
	 * Calculate optimal frame duration based on frame count
	 */
	private calculateOptimalFrameDuration(frameCount: number): number {
		// Shorter durations for more frames, longer for fewer
		if (frameCount <= 5) return 300;
		if (frameCount <= 10) return 250;
		if (frameCount <= 20) return 200;
		if (frameCount <= 50) return 150;
		return ANIMATED_QR_CONFIG.MIN_FRAME_DURATION;
	}
}

/**
 * Create new animated QR handler
 */
export function createAnimatedQrHandler(config?: Partial<AnimatedQrConfig>): AnimatedQrHandler {
	return new AnimatedQrHandler(config);
}

/**
 * Default animated QR handler instance
 */
export const defaultAnimatedQrHandler = new AnimatedQrHandler();
