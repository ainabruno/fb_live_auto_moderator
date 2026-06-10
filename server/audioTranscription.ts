import { transcribeAudio } from "./_core/voiceTranscription";

// Type definitions for transcription results
interface TranscriptionResult {
  text: string;
  language?: string;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  language: string;
}

export interface TranscriptionSession {
  sessionId: number;
  isActive: boolean;
  currentTranscript: string;
  segments: TranscriptionSegment[];
  lastUpdateTime: Date;
  totalDuration: number;
  language: string;
}

/**
 * Audio Transcription Service
 * Handles real-time transcription of Facebook Live audio streams
 */
export class AudioTranscriptionService {
  private sessions: Map<number, TranscriptionSession> = new Map();
  private audioBuffers: Map<number, Uint8Array[]> = new Map();
  private transcriptionIntervals: Map<number, NodeJS.Timeout> = new Map();

  /**
   * Start transcription for a session
   */
  async startTranscription(sessionId: number): Promise<TranscriptionSession> {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const session: TranscriptionSession = {
      sessionId,
      isActive: true,
      currentTranscript: "",
      segments: [],
      lastUpdateTime: new Date(),
      totalDuration: 0,
      language: "en",
    };

    this.sessions.set(sessionId, session);
    this.audioBuffers.set(sessionId, []);

    // Start periodic transcription processing
    this.startTranscriptionProcessing(sessionId);

    return session;
  }

  /**
   * Stop transcription for a session
   */
  async stopTranscription(sessionId: number): Promise<TranscriptionSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.isActive = false;

    // Clear interval
    const interval = this.transcriptionIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.transcriptionIntervals.delete(sessionId);
    }

    // Process any remaining audio
    await this.processAudioBuffer(sessionId);

    return session;
  }

  /**
   * Add audio chunk to buffer
   */
  addAudioChunk(sessionId: number, audioData: Uint8Array): void {
    const buffers = this.audioBuffers.get(sessionId);
    if (!buffers) return;

    buffers.push(audioData);
  }

  /**
   * Get current transcript
   */
  getTranscript(sessionId: number): string {
    const session = this.sessions.get(sessionId);
    return session?.currentTranscript || "";
  }

  /**
   * Get transcript segments
   */
  getSegments(sessionId: number): TranscriptionSegment[] {
    const session = this.sessions.get(sessionId);
    return session?.segments || [];
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: number): TranscriptionSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Start periodic transcription processing
   */
  private startTranscriptionProcessing(sessionId: number): void {
    // Process audio every 5 seconds
    const interval = setInterval(async () => {
      const session = this.sessions.get(sessionId);
      if (!session || !session.isActive) {
        clearInterval(interval);
        return;
      }

      await this.processAudioBuffer(sessionId);
    }, 5000);

    this.transcriptionIntervals.set(sessionId, interval);
  }

  /**
   * Process accumulated audio buffer
   */
  private async processAudioBuffer(sessionId: number): Promise<void> {
    const buffers = this.audioBuffers.get(sessionId);
    const session = this.sessions.get(sessionId);

    if (!buffers || buffers.length === 0 || !session) return;

    try {
      // Combine all buffers into one
      const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
      const combinedBuffer = new Uint8Array(totalLength);
      let offset = 0;

      for (const buffer of buffers) {
        combinedBuffer.set(buffer, offset);
        offset += buffer.length;
      }

      // Convert to blob and create URL for transcription
      const blob = new Blob([combinedBuffer], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(blob);

      // Transcribe audio using Whisper API
      const result = await transcribeAudio({
        audioUrl,
        language: session.language,
        prompt: `Context: ${session.currentTranscript.substring(0, 500)}`,
      });

      // Update session with transcription results
      if (result && typeof result === "object" && "text" in result) {
        const resultData = result as any;
        const newSegment: TranscriptionSegment = {
          id: `segment_${Date.now()}`,
          text: resultData.text,
          startTime: session.totalDuration,
          endTime: session.totalDuration + (resultData.segments?.length || 0),
          confidence: 0.95,
          language: resultData.language || session.language,
        };

        session.segments.push(newSegment);
        session.currentTranscript += " " + resultData.text;
        session.lastUpdateTime = new Date();
        session.language = resultData.language || session.language;

        // Update total duration
        if (resultData.segments && resultData.segments.length > 0) {
          const lastSegment = resultData.segments[resultData.segments.length - 1];
          if (lastSegment.end) {
            session.totalDuration = lastSegment.end;
          }
        }
      }

      // Clean up
      URL.revokeObjectURL(audioUrl);

      // Clear processed buffers
      buffers.length = 0;
    } catch (error) {
      console.error(`[AudioTranscription] Error processing audio for session ${sessionId}:`, error);
    }
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: number): void {
    const interval = this.transcriptionIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.transcriptionIntervals.delete(sessionId);
    }

    this.sessions.delete(sessionId);
    this.audioBuffers.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TranscriptionSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive);
  }
}

// Export singleton instance
export const audioTranscriptionService = new AudioTranscriptionService();
