import { useState, useEffect, useCallback } from 'react';

// Extend window object for prefixed SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition API is not supported in this browser. Try Chrome.");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.continuous = false; // We want it to stop after a single utterance for UX
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setError(event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, []);

  const startListening = useCallback(() => {
    if (!recognition) return;
    setError(null);
    setTranscript('');
    setIsListening(true);
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      // Already started or other error
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    try {
      recognition.stop();
    } catch(e) {}
    setIsListening(false);
  }, [recognition]);

  return { isListening, transcript, startListening, stopListening, error, resetTranscript: () => setTranscript('') };
};
