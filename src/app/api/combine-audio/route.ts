import { NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { runFFmpegCommand } from '@/utils/ffmpeg-setup';

export const runtime = "nodejs";
export const preferredRegion = ["iad1"];

// Helper function to extract MP3 data from ID3-tagged file
function extractMP3Data(buffer: Buffer): Buffer {
  // Check for ID3v2 tag
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) { // "ID3"
    // Get ID3 tag size (last 4 bytes of header, synchsafe integer)
    const size = ((buffer[6] & 0x7f) << 21) |
                 ((buffer[7] & 0x7f) << 14) |
                 ((buffer[8] & 0x7f) << 7) |
                 (buffer[9] & 0x7f);
    const tagSize = size + 10; // Add header size
    
    console.log('Found ID3v2 tag:', {
      version: `2.${buffer[3]}.${buffer[4]}`,
      tagSize,
      totalSize: buffer.length
    });

    // Extract the actual MP3 data after the ID3 tag
    const mp3Data = buffer.slice(tagSize);
    
    // Verify the extracted data starts with an MP3 frame
    if (mp3Data[0] === 0xFF && (mp3Data[1] & 0xE0) === 0xE0) {
      console.log('Successfully extracted MP3 data:', {
        size: mp3Data.length,
        preview: mp3Data.slice(0, 20).toString('hex')
      });
      return mp3Data;
    }
  }

  // If no ID3 tag or invalid format, check if it's raw MP3
  if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
    console.log('Found raw MP3 data');
    return buffer;
  }

  console.log('Invalid MP3 data:', {
    firstBytes: buffer.slice(0, 4).toString('hex'),
    possibleHeader: buffer.slice(0, 10).toString('hex')
  });

  throw new Error('Invalid MP3 format');
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received request body keys:', Object.keys(data));

    // Extract all necessary parameters
    const {
      text,
      selectedBackingTrack,
      ttsVolume = 1,
      backingTrackVolume = 1,
      trackDuration = 900,
      ttsDuration = 0,
      playbackRate = 1
    } = data;

    if (!text) {
      throw new Error('TTS audio data is required');
    }

    // Handle base64 data URLs for TTS audio
    let ttsBuffer: Buffer;
    try {
      // Check if it's a base64 data URL
      if (text.startsWith('data:audio/')) {
        const base64Data = text.split(',')[1];
        ttsBuffer = Buffer.from(base64Data, 'base64');
        console.log('Decoded base64 TTS audio:', {
          size: ttsBuffer.length,
          preview: ttsBuffer.slice(0, 20).toString('hex')
        });
      } else {
        // Handle regular URLs
        const ttsResponse = await fetch(text);
        if (!ttsResponse.ok) {
          throw new Error(`Failed to fetch TTS audio: ${ttsResponse.statusText}`);
        }
        const arrayBuffer = await ttsResponse.arrayBuffer();
        ttsBuffer = Buffer.from(arrayBuffer);
        console.log('TTS audio fetched successfully:', {
          contentType: ttsResponse.headers.get('content-type'),
          bufferSize: ttsBuffer.length,
          preview: ttsBuffer.slice(0, 20).toString('hex')
        });
      }

      // Extract MP3 data from the buffer
      ttsBuffer = extractMP3Data(ttsBuffer);

    } catch (error) {
      console.error('Error processing TTS audio:', error);
      throw new Error('Failed to process TTS audio data');
    }

    // Download the backing track if provided
    let backingTrackBuffer = null;
    if (selectedBackingTrack) {
      try {
        const backingResponse = await fetch(selectedBackingTrack);
        if (!backingResponse.ok) {
          throw new Error('Failed to fetch backing track');
        }
        const arrayBuffer = await backingResponse.arrayBuffer();
        backingTrackBuffer = Buffer.from(arrayBuffer);
        console.log('Backing track fetched successfully:', {
          contentType: backingResponse.headers.get('content-type'),
          bufferSize: backingTrackBuffer.length,
          preview: backingTrackBuffer.slice(0, 20).toString('hex')
        });

        // Extract MP3 data from backing track
        backingTrackBuffer = extractMP3Data(backingTrackBuffer);
      } catch (error) {
        console.error('Error fetching backing track:', error);
        throw new Error('Failed to fetch backing track');
      }
    }

    // Convert volume from 0-1 to dB
    const ttsVolumeDB = (ttsVolume > 0 ? 20 * Math.log10(ttsVolume) : -60).toFixed(2);
    const backingVolumeDB = (backingTrackVolume > 0 ? 20 * Math.log10(backingTrackVolume) : -60).toFixed(2);

    // Calculate actual duration based on TTS speed
    const adjustedTtsDuration = ttsDuration / playbackRate;
    const repetitions = Math.ceil(trackDuration / adjustedTtsDuration);
    
    // Build the filter complex string
    let filterComplex = '[0:a]aresample=44100,';
    const clampedRate = Math.min(Math.max(playbackRate, 0.25), 4.0);
    
    // Apply speed adjustment
    if (clampedRate !== 1) {
      if (clampedRate <= 2.0 && clampedRate >= 0.5) {
        filterComplex += `atempo=${clampedRate.toFixed(2)},`;
      } else {
        const tempoPerFilter = Math.sqrt(clampedRate);
        filterComplex += `atempo=${tempoPerFilter.toFixed(2)},atempo=${tempoPerFilter.toFixed(2)},`;
      }
    }

    // Add volume adjustment
    filterComplex += `volume=${ttsVolumeDB}dB[a1];`;
    filterComplex += `[1:a]aresample=44100,volume=${backingVolumeDB}dB[a2];`;
    filterComplex += `[a1][a2]amix=inputs=2:duration=first[aout]`;

    // Update the FFmpeg execution part
    try {
      // Create temporary files
      const tempDir = os.tmpdir();
      const sessionId = uuidv4();
      const ttsPath = path.join(tempDir, `tts-${sessionId}.mp3`);
      const backingPath = path.join(tempDir, `backing-${sessionId}.mp3`);
      const outputPath = path.join(tempDir, `output-${sessionId}.mp3`);

      // Write files
      await fs.writeFile(ttsPath, ttsBuffer);
      if (backingTrackBuffer) {
        await fs.writeFile(backingPath, backingTrackBuffer);
      }

      // Run FFmpeg with proper command structure
      await runFFmpegCommand(
        ttsPath,
        outputPath,
        backingPath,
        filterComplex,
        repetitions
      );

      // Read the output file
      const outputBuffer = await fs.readFile(outputPath);

      // Clean up
      await Promise.all([
        fs.unlink(ttsPath),
        fs.unlink(backingPath),
        fs.unlink(outputPath)
      ]).catch(console.error);

      return new NextResponse(outputBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="combined.mp3"'
        }
      });

    } catch (error: any) {
      console.error('Error processing audio:', error);
      return NextResponse.json({ 
        error: error.message || 'Failed to process audio',
        details: error.stack
      }, { 
        status: 500 
      });
    }

  } catch (error: any) {
    console.error('Error processing audio:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process audio',
      details: error.stack
    }, { 
      status: 500 
    });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://subliminal-systems.vercel.app',
    'https://subliminal-systems.vercel.app',
    'http://localhost:3000'
  ];

  if (!origin || !allowedOrigins.includes(origin)) {
    return new Response(null, { status: 204 });
  }

  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3000'
    },
  });
}
