
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface ConversationViewProps {
  messages: Message[];
}

const ConversationView: React.FC<ConversationViewProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 bg-gray-800/50 rounded-lg p-4 overflow-y-auto h-96">
      <div className="space-y-4">
        {messages.map((msg, index) => {
          if (msg.role === 'system') {
            return (
              <div key={index} className="text-center text-sm text-gray-400 italic">
                {msg.text}
              </div>
            );
          }

          const isInterviewer = msg.role === 'interviewer';
          if (!msg.text) return null; // Don't render video messages in text chat

          return (
            <div key={index} className={`flex ${isInterviewer ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md lg:max-w-lg p-3 rounded-lg shadow-md ${
                  isInterviewer
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-cyan-700 text-white rounded-bl-none'
                }`}
              >
                <p className="font-bold capitalize text-sm mb-1">{msg.role}</p>
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ConversationView;
