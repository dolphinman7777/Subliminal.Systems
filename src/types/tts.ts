export interface TTSJob {
  text: string;
  voice: string;
}

export interface TTSRequest {
  text: string;
  voice: string;
}

export interface TTSResponse {
  success: boolean;
  audioBuffer?: ArrayBuffer;
  error?: string;
}
