import { useEffect, useState, useCallback } from 'react';

interface VoiceListenerOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceListener(options: VoiceListenerOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check browser support
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(supported);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      options.onError?.('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? false;
    recognition.lang = options.lang ?? 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      options.onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      options.onError?.(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    return () => {
      recognition.stop();
      setIsListening(false);
    };
  }, [isSupported, options]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}
