import { NextResponse } from 'next/server';
import { addJobToQueue } from '@/utils/jobQueue';

export async function POST(request: Request) {
  try {
    const { text, userId, voice } = await request.json();

    if (!text || !userId || !voice) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Add job to the queue
    const jobId = await addJobToQueue({ text, userId, voice });

    return NextResponse.json({ jobId }, { status: 200 });
  } catch (error) {
    console.error('Error queuing TTS job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
