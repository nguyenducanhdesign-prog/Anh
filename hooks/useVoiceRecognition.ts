import { useState, useEffect, useRef } from 'react';

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

const getSpeechRecognition = (): { new(): SpeechRecognition } | null => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return SpeechRecognition ? SpeechRecognition : null;
};

export const useVoiceRecognition = (lang: string = 'en-US') => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognition = getSpeechRecognition();
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                 setTranscript(finalTranscript.trim());
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        
        // Cleanup on component unmount
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };

    }, [lang]);

    const start = () => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const stop = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };
    
    return { isListening, transcript, start, stop };
};
