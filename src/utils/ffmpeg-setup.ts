import { spawn } from 'child_process';

interface FFmpegOptions {
  inputs: Array<{
    path: string;
    options?: string[];
  }>;
  output: {
    path: string;
    options?: string[];
  };
  filterComplex?: string;
}

export function createFFmpeg() {
  return {
    run: async (options: FFmpegOptions): Promise<void> => {
      return new Promise((resolve, reject) => {
        const args: string[] = [
          // Add resource optimization flags
          '-threads', '2',  // Limit threads
        ];

        // Add inputs and their options
        options.inputs.forEach(input => {
          if (input.options) {
            args.push(...input.options);
          }
          args.push('-i', input.path);
        });

        // Add filter complex if present
        if (options.filterComplex) {
          args.push('-filter_complex', options.filterComplex);
        }

        // Add output options
        if (options.output.options) {
          args.push(...options.output.options);
        }

        // Add output path
        args.push(options.output.path);

        console.log('Running FFmpeg with args:', args);

        const ffmpeg = spawn('ffmpeg', args);

        let stdoutData = '';
        let stderrData = '';

        ffmpeg.stdout.on('data', (data) => {
          stdoutData += data.toString();
          console.log('FFmpeg stdout:', data.toString());
        });

        ffmpeg.stderr.on('data', (data) => {
          stderrData += data.toString();
          console.log('FFmpeg stderr:', data.toString());
        });

        ffmpeg.on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            console.error('FFmpeg stderr output:', stderrData);
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });
      });
    }
  };
}

export async function runFFmpegCommand(inputPath: string, outputPath: string, backingPath: string, filterComplex: string, repetitions: number): Promise<void> {
  const ffmpeg = createFFmpeg();
  await ffmpeg.run({
    inputs: [
      {
        path: inputPath,
        options: ['-stream_loop', repetitions.toString()]
      },
      {
        path: backingPath,
        options: ['-stream_loop', '-1']
      }
    ],
    filterComplex,
    output: {
      path: outputPath,
      options: [
        '-map', '[aout]',
        '-t', '900',
        '-acodec', 'libmp3lame',
        '-b:a', '96k',  // Reduced bitrate
        '-ar', '44100',
        '-ac', '2',
        '-bufsize', '1M',  // Reduced buffer size
        '-maxrate', '128k',  // Reduced max rate
        '-threads', '2'  // Limit threads for output encoding
      ]
    }
  });
}