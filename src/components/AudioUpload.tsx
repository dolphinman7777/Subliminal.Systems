'use client';

import * as React from 'react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export function AudioUpload() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const audioFiles = Array.from(e.target.files).filter((file: File) => 
        file.type.startsWith('audio/') || file.type === 'application/octet-stream'
      );
      
      if (audioFiles.length !== e.target.files.length) {
        toast.error('Some files were skipped because they are not audio files');
      }
      
      setFiles(audioFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please select at least one audio file');
      return;
    }

    setLoading(true);
    try {
      const audioData = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return `data:${file.type};base64,${base64}`;
        })
      );

      const response = await fetch('/api/combine-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ttsAudioUrl: audioData[0],
          selectedBackingTrack: audioData[1],
          ttsVolume: 1,
          backingTrackVolume: 1
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to combine audio files');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'combined.mp3';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Audio files combined successfully!');
      setFiles([]); // Clear files after successful combination
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to combine audio files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="audio-upload"
          />
          <label
            htmlFor="audio-upload"
            className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Select Audio Files
          </label>
          {files.length > 0 && (
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-medium mb-2">Selected Files:</p>
              <ul className="space-y-2">
                {files.map((file: File, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center">
                    <span className="truncate">{file.name}</span>
                    <span className="ml-2 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading || files.length === 0}
        >
          {loading ? 'Combining Audio Files...' : 'Combine Audio Files'}
        </Button>
      </form>
    </div>
  );
} 