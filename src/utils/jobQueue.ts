import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
// import { pubsub } from './pubsub';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTS_QUEUE = 'tts-processing';

const jobQueue: TTSJob[] = []

// Initialize the ttsQueue
const ttsQueue = {
  add: async (job: { text: string; userId: string; voice: string }) => {
    const jobId = uuidv4();
    const jobData = { id: jobId, ...job, status: 'pending' };
    await redis.lpush(TTS_QUEUE, JSON.stringify(jobData));
    return jobId;
  },
  getJob: async () => {
    const jobString = await redis.rpop(TTS_QUEUE);
    return jobString ? JSON.parse(jobString) : null;
  },
};

// The TTSJob type is already defined here, so we don't need to import it
export type TTSJob = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  text: string;
  userId: string;
  voice: string;
  audioUrl?: string;
  error?: string;
};

export const addJob = (text: string, userId: string, voice: string): TTSJob => {
  const newJob: TTSJob = {
    id: uuidv4(),
    status: 'pending',
    text,
    userId,
    voice,
  };
  jobQueue.push(newJob);
  // pubsub.publish('jobAdded', newJob);
  return newJob;
};

export const getJobStatus = async (jobId: string): Promise<TTSJob | null> => {
  try {
    console.log(`Fetching status for job ${jobId}`);
    const jobString = await redis.get(`job:${jobId}`);
    if (!jobString || typeof jobString !== 'string') {
      console.log(`Job ${jobId} not found or invalid`);
      return null;
    }
    const job = JSON.parse(jobString) as TTSJob;
    console.log(`Found job ${jobId}, status: ${job.status}`);
    return job;
  } catch (error) {
    console.error(`Error getting job status for ${jobId}:`, error);
    throw error;
  }
};

// This function should be called by a separate worker process
export const processJobs = async () => {
  while (true) {
    const jobString = await redis.rpop(TTS_QUEUE);
    if (!jobString) {
      // No jobs in the queue, wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    const job = JSON.parse(jobString);
    console.log(`Processing job ${job.id}`);

    try {
      // Simulate TTS processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Update job status
      job.status = 'completed';
      job.audioUrl = `https://example.com/audio/${job.id}.mp3`;
      
      // Store the completed job
      await redis.set(`job:${job.id}`, JSON.stringify(job));
      
      console.log(`Job ${job.id} completed`);
    } catch (error: any) {
      console.error(`Error processing job ${job.id}:`, error);
      job.status = 'failed';
      job.error = error.message;
      await redis.set(`job:${job.id}`, JSON.stringify(job));
    }
  }
};

function generateJobId(): string {
  return Math.random().toString(36).substr(2, 9)
}

async function processJob(job: TTSJob): Promise<void> {
  try {
    // Simulate TTS processing delay
    await new Promise(resolve => setTimeout(resolve, 5000))

    // TODO: Integrate with ElevenLabs API or your preferred TTS service
    // For demonstration, we'll mark it as completed with a mock audio URL
    job.status = 'completed'
    job.audioUrl = 'https://example.com/audio.mp3'
  } catch (error) {
    console.error('Error processing TTS job:', error)
    job.status = 'failed'
  }
}

export async function addJobToQueue({ text, userId, voice }: { text: string; userId: string; voice: string }): Promise<string> {
  const jobId = await ttsQueue.add({ text, userId, voice });
  return jobId;
}

export { redis, ttsQueue };

export interface Job {
  text: string;
  userId: string;
  voice: string;
}
