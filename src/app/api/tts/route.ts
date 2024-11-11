import { NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, Engine, LanguageCode, OutputFormat, TextType, VoiceId } from "@aws-sdk/client-polly";

// Initialize Polly client
const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function convertToSpeech(text: string): Promise<Buffer> {
  const params = {
    Text: text,
    OutputFormat: 'mp3' as OutputFormat,
    VoiceId: 'Joanna' as VoiceId,
    Engine: 'standard' as Engine,
    LanguageCode: "en-US" as LanguageCode,
    TextType: "text" as TextType,
    SampleRate: "22050",
  };

  const command = new SynthesizeSpeechCommand(params);
  const response = await polly.send(command);

  if (!response.AudioStream) {
    throw new Error('No audio stream returned');
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.AudioStream as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log('Received text for TTS:', text);

    // Split text into affirmations with proper typing
    const affirmations: string[] = text
      .split(/(?<=\.|\?|\!)\s+/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    console.log(`Found ${affirmations.length} affirmations to process`);

    // Convert each affirmation
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < affirmations.length; i++) {
      const affirmation = affirmations[i];
      console.log(`Converting affirmation ${i + 1}/${affirmations.length}`);
      
      try {
        // Add pause markers
        const textWithPause = `${affirmation} ... `;
        const buffer = await convertToSpeech(textWithPause);
        
        if (buffer.length === 0) {
          throw new Error(`Empty audio buffer for affirmation ${i + 1}`);
        }

        audioBuffers.push(buffer);
        console.log(`Successfully converted affirmation ${i + 1}, buffer size: ${buffer.length}`);
        
        // Add small delay between conversions
        if (i < affirmations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to convert affirmation ${i + 1}:`, error);
        throw error;
      }
    }

    // Combine all audio buffers
    const finalBuffer = Buffer.concat(audioBuffers);
    console.log('Final audio buffer size:', finalBuffer.length);

    if (finalBuffer.length === 0) {
      throw new Error('Generated audio is empty');
    }

    const audioBase64 = finalBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    console.log('TTS conversion completed successfully');
    console.log('Total affirmations processed:', affirmations.length);
    console.log('Individual affirmations:');
    affirmations.forEach((aff: string, i: number) => {
      console.log(`${i + 1}: ${aff.substring(0, 50)}... (${audioBuffers[i].length} bytes)`);
    });

    return NextResponse.json({ 
      audioUrl,
      affirmationsProcessed: affirmations.length,
      audioSize: finalBuffer.length,
      success: true
    });

  } catch (error) {
    console.error('Error in TTS conversion:', error);
    return NextResponse.json({ 
      error: 'TTS conversion failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
