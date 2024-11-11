#!/bin/bash

if [ -n "$VERCEL" ]; then
  echo "Installing FFmpeg on Vercel..."
  
  # Install FFmpeg using Amazon Linux 2023's package manager
  yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm
  yum install -y ffmpeg ffmpeg-devel

  # Verify installation
  which ffmpeg
  ffmpeg -version
  
  echo "FFmpeg installation completed"
else
  echo "Not running on Vercel, skipping FFmpeg installation"
fi
