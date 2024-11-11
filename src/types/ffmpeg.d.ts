declare module '@ffmpeg-installer/ffmpeg' {
  const path: string;
  export default { path: string };
}

declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    input(path: string): FfmpegCommand;
    inputOptions(options: string[]): FfmpegCommand;
    complexFilter(filters: string | string[]): FfmpegCommand;
    outputOptions(options: string[]): FfmpegCommand;
    save(outputPath: string): FfmpegCommand;
    on(event: 'error' | 'end', callback: (err?: Error) => void): FfmpegCommand;
  }

  function ffmpeg(): FfmpegCommand;
  function setFfmpegPath(path: string): void;

  export default ffmpeg;
} 