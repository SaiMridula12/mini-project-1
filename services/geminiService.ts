
import { GoogleGenAI, GenerateContentRequest, Part } from "@google/genai";

// IMPORTANT: This function assumes that window.aistudio.hasSelectedApiKey() has been checked
// and window.aistudio.openSelectKey() has been called if needed before this function is invoked.
// A new GoogleGenAI instance is created on each call to ensure the latest key is used.
export const generateSignVideo = async (text: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not available. Please select one.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Generate a short, animated video of a person performing Indian Sign Language (ISL) for the following phrase: "${text}". The background should be a solid, neutral gray color. The animation should be clear and easy for a deaf person to understand.`;
    
    console.log("Generating video with prompt:", prompt);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    // Polling logic for video generation
    const loadingMessages = [
        "Initializing video generation...",
        "Animating the signs...",
        "Rendering the video sequence...",
        "Applying final touches...",
        "Almost ready, preparing the video stream...",
    ];
    let messageIndex = 0;

    while (!operation.done) {
        console.log(loadingMessages[messageIndex % loadingMessages.length]);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
        messageIndex++;
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }
    
    // The API key must be appended to the download URI to authenticate the request.
    const authenticatedUrl = `${downloadLink}&key=${process.env.API_KEY}`;

    // Fetch the video as a blob and create an object URL
    const response = await fetch(authenticatedUrl);
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to fetch video file: ${response.statusText}. Details: ${errorBody}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};


export const transcribeSignFrames = async (base64Frames: string[]): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not available. This feature requires a standard Gemini API Key.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const imageParts: Part[] = base64Frames.map(frame => ({
        inlineData: {
            data: frame,
            mimeType: 'image/jpeg',
        },
    }));

    const contents: GenerateContentRequest['contents'] = [{
        parts: [
            { text: 'You are an expert Indian Sign Language (ISL) interpreter. The context is a job interview. Analyze these sequential video frames and transcribe the sign language into a single, coherent English sentence. Be concise and accurate.' },
            ...imageParts
        ]
    }];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
    });

    return response.text;
};
