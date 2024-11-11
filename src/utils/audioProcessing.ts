import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function processAudio(audioBuffer: Buffer): Promise<string> {
  const fileName = `${uuidv4()}.mp3`;
  
  try {
    // Upload to S3 without ACL
    const uploadResult = await s3.upload({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `audio/${fileName}`,
      Body: audioBuffer,
      ContentType: 'audio/mpeg',
    }).promise();

    // Return the URL
    return uploadResult.Location;
  } catch (error) {
    console.error('Error processing audio:', error);
    throw new Error('Audio processing failed');
  }
} 