import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { backgroundTracks } from '@/lib/backgroundTracks';
import type { BackgroundTrack } from '@/types/backgroundTrack';

interface BackingTrackSelectorProps {
  onSelect: (track: BackgroundTrack) => void;
}

export function BackingTrackSelector({ onSelect }: BackingTrackSelectorProps) {
  useEffect(() => {
    console.log('Available tracks:', backgroundTracks);
    console.log('CloudFront URL:', process.env.NEXT_PUBLIC_CLOUDFRONT_URL);
  }, []);

  return (
    <Select onValueChange={(value) => {
      const track = backgroundTracks.find(t => t.id === value);
      if (track) onSelect(track);
    }}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a backing track" />
      </SelectTrigger>
      <SelectContent>
        {backgroundTracks.map((track) => (
          <SelectItem key={track.id} value={track.id}>
            {track.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
