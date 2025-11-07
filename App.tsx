// App.tsx
import React, { useState, useCallback, useRef } from 'react';
import { generateVideoFeedback } from './services/geminiService';

interface VideoInputProps {
  onVideoSelected: (file: File | null) => void;
  videoPreviewUrl: string | null;
}

const VideoInput: React.FC<VideoInputProps> = ({ onVideoSelected, videoPreviewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    onVideoSelected(file);
  };

  const handleClearVideo = () => {
    onVideoSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };

  return (
    <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-blue-500 transition-all duration-200">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Upload seu Vídeo Curto</h3>
      <label
        htmlFor="video-upload"
        className="w-full cursor-pointer flex flex-col items-center justify-center bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 transition-colors duration-200 mb-4"
      >
        <svg
          className="w-6 h-6 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          ></path>
        </svg>
        <span>Selecionar Vídeo</span>
        <input
          id="video-upload"
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {videoPreviewUrl && (
        <div className="w-full mt-4 flex flex-col items-center">
          <video
            controls
            src={videoPreviewUrl}
            className="max-w-full h-auto rounded-md shadow-md mb-4"
            style={{ maxHeight: '300px' }}
          >
            Seu navegador não suporta a tag de vídeo.
          </video>
          <button
            onClick={handleClearVideo}
            className="text-red-500 hover:text-red-700 font-medium transition-colors duration-200"
          >
            Remover Vídeo
          </button>
        </div>
      )}
      {!videoPreviewUrl && (
        <p className="text-gray-500 text-sm">Apenas arquivos de vídeo são aceitos (.mp4, .mov, etc.)</p>
      )}
    </div>
  );
};

function App() {
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(
    'Me dê feedback sobre como melhorar este vídeo'
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleVideoSelected = useCallback((file: File | null) => {
    setSelectedVideoFile(file);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl); // Clean up previous object URL
    }
    if (file) {
      setVideoPreviewUrl(URL.createObjectURL(file));
    } else {
      setVideoPreviewUrl(null);
    }
    setFeedback(null); // Clear previous feedback
    setError(null); // Clear previous error
  }, [videoPreviewUrl]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Extract base64 part only (remove data:mime/type;base64,)
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64 string.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleGenerateFeedback = useCallback(async () => {
    if (!selectedVideoFile) {
      setError('Por favor, faça upload de um vídeo primeiro.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const base64Video = await convertFileToBase64(selectedVideoFile);
      const videoMimeType = selectedVideoFile.type;

      const aiFeedback = await generateVideoFeedback(
        { base64: base64Video, mimeType: videoMimeType },
        prompt
      );
      setFeedback(aiFeedback);
    } catch (err) {
      console.error('Error in handleGenerateFeedback:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao gerar o feedback. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedVideoFile, prompt]);

  return (
    <div className="flex flex-col max-w-4xl w-full bg-white shadow-xl rounded-2xl overflow-hidden md:flex-row">
      {/* Left Pane - Input Section */}
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center md:text-left leading-tight">
            Torne-se Viral no Instagram e TikTok 10x Mais Fácil com IA
          </h1>

          <VideoInput onVideoSelected={handleVideoSelected} videoPreviewUrl={videoPreviewUrl} />

          <div className="mt-8">
            <label htmlFor="prompt" className="block text-gray-700 text-lg font-semibold mb-2">
              Sua Pergunta para a IA:
            </label>
            <textarea
              id="prompt"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none h-32 text-gray-800"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Me dê feedback sobre como melhorar este vídeo"
            ></textarea>
          </div>
        </div>

        <div className="mt-8">
          {error && (
            <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleGenerateFeedback}
            disabled={isLoading || !selectedVideoFile}
            className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg transition-colors duration-300
                        ${isLoading || !selectedVideoFile
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Gerando Feedback...
              </span>
            ) : (
              'Gerar Feedback'
            )}
          </button>
        </div>
      </div>

      {/* Right Pane - Feedback Section */}
      <div className="w-full md:w-1/2 p-8 bg-gray-50 flex flex-col justify-start overflow-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
          Feedback da IA
        </h2>
        {feedback ? (
          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            {/* Render feedback as HTML, assuming AI provides markdown-like formatting that can be safely rendered */}
            <div
              dangerouslySetInnerHTML={{
                __html: feedback
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
                  .replace(/^- (.*)/gm, '<li>$1</li>') // Bullet points
                  .replace(/^\d+\. (.*)/gm, '<li>$1</li>') // Numbered list items
                  .replace(/(<\/strong>)\n<li>/g, '$1<ul><li>') // Start ul after bold
                  .replace(/(<\/li>)\n<strong>/g, '</li></ul><strong>') // End ul before next bold section
                  .replace(/(<\/li>)\n\n<li>/g, '</li></ul><strong>') // Fix for case where an empty line precedes a new list item and list formatting is already applied
                  .replace(/<li>.*?<\/li>/g, (match, offset, original) => {
                    // Check if the list item is already inside <ul> or <ol>
                    const parentUl = original.substring(0, offset).lastIndexOf('<ul>');
                    const parentOl = original.substring(0, offset).lastIndexOf('<ol>');
                    const lastListEnd = Math.max(original.substring(0, offset).lastIndexOf('</ul>'), original.substring(0, offset).lastIndexOf('</ol>'));
                    if (parentUl > lastListEnd || parentOl > lastListEnd) {
                      return match; // Already inside a list
                    }
                    if (match.match(/^- /)) { // If it's a bullet point
                      return `<ul>${match}</ul>`;
                    }
                    if (match.match(/^\d+\. /)) { // If it's a numbered list
                      return `<ol>${match}</ol>`;
                    }
                    return match;
                  })
              }}
            />
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Faça upload de um vídeo e clique em "Gerar Feedback" para começar!
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
