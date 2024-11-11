#!/bin/bash

# Install FFmpeg on Vercel
if [ "$VERCEL" = "1" ]; then
  echo "Setting up FFmpeg on Vercel..."
  yum install -y ffmpeg

# Install FFmpeg locally if needed
else
  if ! command -v ffmpeg &> /dev/null; then
    echo "Installing FFmpeg locally..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
      brew install ffmpeg
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      sudo apt-get update && sudo apt-get install -y ffmpeg
    fi
  fi
fi 