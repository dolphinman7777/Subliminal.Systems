# Subliminal Systems

A Next.js application for generating and processing personalized audio affirmations.

## Setup

1. Clone the repository:
```bash
git clone https://github.com/dolphinman7777/Subliminal.Systems.git
cd Subliminal.Systems
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in required environment variables:
     ```
     AWS_ACCESS_KEY_ID=
     AWS_SECRET_ACCESS_KEY=
     AWS_REGION=
     S3_BUCKET_NAME=
     CLOUDFRONT_URL=
     UPSTASH_REDIS_REST_URL=
     UPSTASH_REDIS_REST_TOKEN=
     ```

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: AWS region (e.g., us-east-1)
- `S3_BUCKET_NAME`: Your S3 bucket name
- `CLOUDFRONT_URL`: Your CloudFront distribution URL
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token

## Deployment

This application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy!

## Features

- Audio file processing and storage
- Cloud CDN integration with CloudFront
- Redis caching with Upstash
- Automatic cleanup of temporary files
- Serverless-ready configuration