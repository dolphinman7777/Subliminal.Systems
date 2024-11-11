'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useClerk } from "@clerk/nextjs";
import { LogOut, Download, Loader2, CheckCircle, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import DotPattern from "@/components/ui/dot-pattern";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signOut } = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [audioDetails, setAudioDetails] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedAudioDetails = localStorage.getItem('pendingAudioDetails');
    if (storedAudioDetails) {
      setAudioDetails(JSON.parse(storedAudioDetails));
    } else {
      toast({
        description: "No audio details found. Please create an audio first.",
        variant: "destructive" as const,
      });
      router.push('/studio');
    }

    localStorage.setItem('paymentCompleted', 'true');
    toast({
      description: 'Payment successful! You can now download your audio.',
    });
    
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [router, toast]);

  useEffect(() => {
    if (!searchParams) return;
    
    const sessionId = searchParams.get('session_id');
    const audioId = searchParams.get('audio_id');
    
    if (sessionId && audioId) {
      fetch('/api/verify-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, audioId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
        }
      })
      .catch(error => {
        console.error('Error verifying purchase:', error);
        toast({
          description: "Failed to verify purchase. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [searchParams, toast]);

  async function handleDownloadAudio() {
    setIsLoading(true);
    try {
      // Get audio details from localStorage
      const audioDetailsStr = localStorage.getItem('pendingAudioDetails');
      if (!audioDetailsStr) {
        throw new Error('Audio data is missing. Please go back to the studio and recreate your audio.');
      }

      const audioDetails = JSON.parse(audioDetailsStr);
      if (!audioDetails.text) {
        throw new Error('Affirmation text is missing.');
      }

      // First generate TTS audio
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: audioDetails.text,
          voice: 'Joanna'
        }),
      });

      if (!ttsResponse.ok) {
        throw new Error('Failed to generate TTS audio');
      }

      const { audioUrl } = await ttsResponse.json();

      // Then combine with backing track
      const response = await fetch('/api/combine-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: audioUrl,
          selectedBackingTrack: audioDetails.selectedBackingTrack,
          ttsVolume: Number(audioDetails.ttsVolume) || 1,
          backingTrackVolume: Number(audioDetails.backingTrackVolume) || 1,
          trackDuration: Number(audioDetails.trackDuration) || 900,
          playbackRate: Number(audioDetails.playbackRate) || 1,
          ttsDuration: Number(audioDetails.ttsDuration) || 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to combine audio');
      }

      // Download the combined audio
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subliminal.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        description: "Your subliminal audio has been downloaded successfully!",
      });

      // Clear the stored audio details
      localStorage.removeItem('pendingAudioDetails');

    } catch (error) {
      console.error('Error in handleDownloadAudio:', error);
      toast({
        description: error instanceof Error ? error.message : 'Failed to download audio',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/'); // Redirect to home page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        description: "Logout failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <DotPattern className="absolute inset-0 z-0 opacity-50" />
      
      {/* Logout Button */}
      <Button 
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white"
      >
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative z-20 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full"
      >
        <motion.h1 
          className="text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Payment Successful!
        </motion.h1>
        
        <motion.div
          className="text-center mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl text-gray-800 dark:text-gray-200">Thank you for your purchase!</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-8"
        >
          <Button 
            onClick={handleDownloadAudio}
            disabled={isLoading || !audioDetails}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Preparing Download...
              </>
            ) : (
              <>
                <Download className="mr-2 h-6 w-6" />
                Download Your Audio
              </>
            )}
          </Button>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Music className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Your personalized audio is ready!</p>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-4 left-4">
        <Image
          src="/head.svg"
          alt="Subliminal Studio Logo"
          width={150}
          height={150}
          className="drop-shadow-[0_0_0.3rem_#3b82f6]"
        />
      </div>
    </div>
  )
}
