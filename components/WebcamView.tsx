
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';

const WebcamView = forwardRef((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const enableStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
        setError("Could not access webcam. Please check permissions and refresh.");
      }
    };
    enableStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    captureFrames: (duration: number, fps: number): Promise<Blob[]> => {
      return new Promise((resolve, reject) => {
        if (!videoRef.current) {
          return reject(new Error("Webcam not available."));
        }
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error("Canvas context not available."));

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const frames: Blob[] = [];
        const interval = 1000 / fps;
        let capturedFrames = 0;
        const totalFrames = (duration / 1000) * fps;

        const intervalId = setInterval(() => {
          if (capturedFrames >= totalFrames) {
            clearInterval(intervalId);
            resolve(frames);
            return;
          }

          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              frames.push(blob);
            }
          }, 'image/jpeg', 0.8);
          capturedFrames++;
        }, interval);
      });
    }
  }));

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      {error ? (
        <div className="text-red-400 p-4 text-center">{error}</div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      )}
    </div>
  );
});

WebcamView.displayName = 'WebcamView';

export default WebcamView;
