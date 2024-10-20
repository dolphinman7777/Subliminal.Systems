import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Instead of subscribing, we'll use polling
  const pollInterval = setInterval(async () => {
    try {
      const latestInvalidation = await redis.get('latest-cache-invalidation');
      if (latestInvalidation) {
        res.write(`data: ${latestInvalidation}\n\n`);
        // Clear the latest invalidation after sending
        await redis.del('latest-cache-invalidation');
      }
    } catch (error) {
      console.error('Error polling cache invalidation:', error);
    }
  }, 5000); // Poll every 5 seconds

  req.on('close', () => {
    clearInterval(pollInterval);
  });
}
