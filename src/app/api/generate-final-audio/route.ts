import { NextResponse } from 'next/server';
import { processAudio } from '@/utils/audioProcessing';

// Update to new route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const startTime = Date.now();
    const audioDetails = await request.json();
    
    // Check remaining time
    if (Date.now() - startTime > 50000) { // 50s safety margin
      throw new Error('Processing timeout approaching');
    }

    // Process in chunks if needed
    const audioUrl = await processAudio(audioDetails.audioBuffer);

    return NextResponse.json({ 
      success: true,
      url: audioUrl,
      expiresIn: 3600
    });
  } catch (error: any) {
    console.error('Error generating final audio:', error);
    
    // Return appropriate error based on type
    const statusCode = error.message.includes('timeout') ? 408 : 500;
    const errorMessage = error.message.includes('timeout') 
      ? 'Processing timeout - please try with a smaller file'
      : 'Failed to generate final audio';

    return NextResponse.json(
      { error: errorMessage }, 
      { status: statusCode }
    );
  }
}
