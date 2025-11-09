
import React from 'react';

interface SignVideoPlayerProps {
  videoUrl?: string;
}

const SignVideoPlayer: React.FC<SignVideoPlayerProps> = ({ videoUrl }) => {
  if (!videoUrl) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2">Waiting for interviewer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black">
      <video
        key={videoUrl}
        src={videoUrl}
        autoPlay
        controls
        className="w-full h-full object-contain"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default SignVideoPlayer;
