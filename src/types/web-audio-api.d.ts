declare module 'web-audio-api' {
  export class AudioContext {
    sampleRate: number;
    destination: AudioDestinationNode;
    decodeAudioData(
      audioData: ArrayBuffer
    ): Promise<AudioBuffer>;
    createBufferSource(): AudioBufferSourceNode;
    createGain(): GainNode;
  }

  export class OfflineAudioContext extends AudioContext {
    constructor(options: {
      numberOfChannels: number;
      length: number;
      sampleRate: number;
    });
    startRendering(): Promise<AudioBuffer>;
  }

  export interface AudioBuffer {
    length: number;
    duration: number;
    sampleRate: number;
    numberOfChannels: number;
    getChannelData(channel: number): Float32Array;
    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void;
    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void;
  }

  export interface AudioBufferSourceNode {
    buffer: AudioBuffer | null;
    loop: boolean;
    start(when?: number): void;
    connect(destination: AudioNode): AudioNode;
  }

  export interface GainNode extends AudioNode {
    gain: {
      value: number;
    };
  }

  export interface AudioNode {
    connect(destination: AudioNode): AudioNode;
  }

  export interface AudioDestinationNode extends AudioNode {}
} 