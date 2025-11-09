
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Message, Role } from './types';
import { transcribeSignFrames, generateSignVideo } from './services/geminiService';
import WebcamView from './components/WebcamView';
import SignVideoPlayer from './components/SignVideoPlayer';
import ConversationView from './components/ConversationView';
import InterviewerInput from './components/InterviewerInput';
import { blobToBase64 } from './utils';

// Define aistudio interface on window
// Fix: Use a named interface 'AIStudio' and make it optional to resolve declaration conflicts.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', text: 'Welcome to the ISL Interview Bridge. The interview will now begin.' },
  ]);
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);
  const [isLoading, setIsLoading] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const webcamRef = useRef<{ captureFrames: (duration: number, fps: number) => Promise<Blob[]> }>(null);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
        try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsApiKeySelected(hasKey);
        } catch (e) {
            console.error("Error checking for API key:", e);
            setIsApiKeySelected(false);
        }
    } else {
        // Fallback for when aistudio is not available
        setIsApiKeySelected(false); 
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectApiKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assume key selection is successful and update state to allow API calls.
        // Race condition mitigation: we don't wait for hasSelectedApiKey to return true.
        setIsApiKeySelected(true); 
      } catch (e) {
        console.error("Error opening API key selection:", e);
        setError("Failed to open API key selection. Please try again.");
      }
    } else {
       setError("API key selection is not available in this environment.");
    }
  };


  const handleSignTranscription = useCallback(async () => {
    if (!webcamRef.current) return;
    setError(null);
    setIsLoading('candidate');
    try {
      const frameBlobs = await webcamRef.current.captureFrames(3000, 5);
      const base64Frames = await Promise.all(frameBlobs.map(blobToBase64));
      
      const text = await transcribeSignFrames(base64Frames);
      
      const newMessage: Message = { role: 'candidate', text };
      setMessages(prev => [...prev, newMessage]);

      // Text-to-speech for the interviewer
      if ('speechSynthesis' in window && text) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during transcription.';
      setError(`Candidate Error: ${errorMessage}`);
      setMessages(prev => [...prev, { role: 'system', text: `Error: Could not transcribe sign. ${errorMessage}` }]);
    } finally {
      setIsLoading(null);
    }
  }, []);

  const handleSendInterviewerMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    await checkApiKey();
    if (!isApiKeySelected) {
       setError("Please select an API key to generate sign language videos.");
       return;
    }

    setError(null);
    const userMessage: Message = { role: 'interviewer', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading('interviewer');
    
    try {
      const videoUrl = await generateSignVideo(text);
      const videoMessage: Message = { role: 'interviewer', videoUrl };
      setMessages(prev => [...prev, videoMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during video generation.';
      if (errorMessage.includes("Requested entity was not found")) {
          setError("API Key not found or invalid. Please select a valid key.");
          setIsApiKeySelected(false); // Reset key state
          setMessages(prev => [...prev, { role: 'system', text: `Error: API Key is invalid. Please re-select your key.`}]);
      } else {
          setError(`Interviewer Error: ${errorMessage}`);
          setMessages(prev => [...prev, { role: 'system', text: `Error: Could not generate video. ${errorMessage}`}]);
      }
    } finally {
      setIsLoading(null);
    }
  }, [isApiKeySelected, checkApiKey]);

  const lastInterviewerVideoUrl = messages.slice().reverse().find(m => m.role === 'interviewer' && m.videoUrl)?.videoUrl;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col lg:flex-row font-sans">
      {/* Left Panel: Candidate's View */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 md:p-6 space-y-4 bg-gray-800/50">
        <h2 className="text-2xl font-bold text-cyan-400">Candidate's View</h2>
        <div className="w-full aspect-video bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-cyan-500/30">
          <WebcamView ref={webcamRef} />
        </div>
        <button
          onClick={handleSignTranscription}
          disabled={!!isLoading}
          className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg text-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading === 'candidate' ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.202 12.512L12 15.714l-3.202-3.202a4 4 0 115.656-5.656L12 9.293l-2.45-2.45a4 4 0 115.657 5.657L12 15.714v-3.202zM9.01 12.01v.002z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 6.343a8 8 0 10-11.314 11.314 8 8 0 0011.314-11.314z" />
            </svg>
          )}
          <span>{isLoading === 'candidate' ? 'Interpreting Sign...' : 'Record Sign (3s)'}</span>
        </button>
        <div className="w-full aspect-video bg-black rounded-lg shadow-2xl overflow-hidden border-2 border-purple-500/30 mt-4">
          <SignVideoPlayer videoUrl={lastInterviewerVideoUrl} />
        </div>
        <p className="text-sm text-gray-400">Interviewer's message will appear here as a sign language video.</p>
      </div>

      {/* Right Panel: Interviewer's View */}
      <div className="w-full lg:w-1/2 flex flex-col p-4 md:p-6 bg-gray-900">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">Interviewer's View</h2>
        <ConversationView messages={messages} />
        {error && <div className="mt-2 p-3 bg-red-800/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}
        
        {!isApiKeySelected && (
            <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg flex flex-col items-center space-y-2 text-center">
                <p className="text-yellow-300">An API key is required for video generation.</p>
                <p className="text-xs text-yellow-400">This enables translation of your text into sign language videos. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">Billing information</a></p>
                <button
                    onClick={handleSelectApiKey}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Select API Key
                </button>
            </div>
        )}
        
        <div className="mt-4">
          <InterviewerInput onSend={handleSendInterviewerMessage} isLoading={isLoading === 'interviewer'} disabled={!isApiKeySelected} />
        </div>
      </div>
    </div>
  );
};

export default App;
