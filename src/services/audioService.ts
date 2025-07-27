export interface AudioRecordingOptions {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
}

class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  /**
   * Start recording audio from the user's microphone
   */
  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options.sampleRate || 16000,
          channelCount: options.channels || 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.audioChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      
      console.log('Audio recording started');
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw new Error('Failed to start audio recording. Please check microphone permissions.');
    }
  }

  /**
   * Stop recording and return the audio data
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (error) => {
        this.cleanup();
        reject(error);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Convert audio blob to base64 string
   */
  async blobToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Convert base64 string back to blob
   */
  base64ToBlob(base64: string, mimeType: string = 'audio/webm'): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Check if recording is active
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Get current recording state
   */
  getRecordingState(): string | null {
    return this.mediaRecorder?.state || null;
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Play audio from blob
   */
  async playAudio(audioBlob: Blob): Promise<void> {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  }

  /**
   * Play audio from base64
   */
  async playAudioFromBase64(base64: string, mimeType: string = 'audio/webm'): Promise<void> {
    const blob = this.base64ToBlob(base64, mimeType);
    await this.playAudio(blob);
  }
}

// Create singleton instance
const audioService = new AudioService();

export default audioService; 