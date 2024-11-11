import { spawn } from 'child_process';

export const runFfmpeg = async (args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Use FFMPEG_PATH environment variable or fallback to 'ffmpeg'
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    
    console.log('Using FFmpeg path:', ffmpegPath);
    
    const ffmpegProcess = spawn(ffmpegPath, [
      '-threads', '2',
      ...args
    ]);

    ffmpegProcess.stderr.on('data', (data) => {
      console.log('FFmpeg stderr:', data.toString());
    });

    ffmpegProcess.stdout.on('data', (data) => {
      console.log('FFmpeg stdout:', data.toString());
    });

    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg process error:', err);
      reject(err);
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
};
