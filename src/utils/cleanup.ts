import { Redis } from '@upstash/redis';
import { S3 } from 'aws-sdk';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function cleanupTempFiles() {
  try {
    const keys = await redis.keys('audio:*');
    
    for (const key of keys) {
      const fileName = key.replace('audio:', '');
      await s3.deleteObject({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `temp/${fileName}`,
      }).promise();
      
      await redis.del(key);
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
} 