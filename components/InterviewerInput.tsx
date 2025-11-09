
import React, { useState } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { MicrophoneIcon, StopIcon } from './icons/AudioIcons';

interface InterviewerInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

const InterviewerInput: React.FC<InterviewerInputProps> = ({ onSend, isLoading, disabled }) => {
  const [text, setText] = useState('');

  const handleTranscriptChange = (transcript: string) => {
    setText(transcript);
  };

  const { isListening, toggleListening } = useSpeechToText(handleTranscriptChange);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2 bg-gray-800/50 p-2 rounded-lg border-2 border-transparent focus-within:border-purple-500 transition-colors">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? "Please select an API Key above" : "Type or speak your message..."}
          className="flex-1 bg-transparent p-2 outline-none resize-none text-gray-100 disabled:text-gray-500"
          rows={3}
          disabled={isLoading || disabled}
        />
        <button
          type="button"
          onClick={toggleListening}
          disabled={isLoading || disabled}
          className={`p-2 rounded-full transition-colors ${
            isListening ? 'bg-red-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
          } disabled:bg-gray-600 disabled:cursor-not-allowed`}
        >
          {isListening ? <StopIcon /> : <MicrophoneIcon />}
        </button>
      </div>
      <button
        type="submit"
        disabled={isLoading || !text.trim() || disabled}
        className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg text-lg font-semibold transition-all duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Video...
          </>
        ) : (
          'Send & Generate Sign Video'
        )}
      </button>
    </form>
  );
};

export default InterviewerInput;
