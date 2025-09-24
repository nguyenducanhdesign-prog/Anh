import React from 'react';
import { Spinner } from './Spinner';
import { XCircleIcon, SparklesIcon, DownloadIcon, ShareIcon } from './Icons';
import { AppState } from '../App.tsx';
import { useTranslation } from '../i18n.ts';
import { upscaleImage } from '../services/geminiService';

interface OutputPanelProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

/**
 * Compresses an image from a data URL to a JPEG format.
 * @param dataUrl The source image data URL (e.g., from a PNG).
 * @param quality The quality of the output JPEG (0.0 to 1.0).
 * @returns A promise that resolves with the compressed JPEG data URL.
 */
const compressImage = (dataUrl: string, quality: number = 0.9): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(img, 0, 0);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => {
      console.error("Image loading error for compression:", err);
      reject(new Error('Failed to load image for compression.'));
    };
    img.src = dataUrl;
  });
};


const OutputPanel: React.FC<OutputPanelProps> = ({ state, dispatch }) => {
  const { status, error, activeImage, editedUrls, upscalingUrl } = state;
  const { t } = useTranslation();

  const handleDownload = (url: string, filename: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShare = async (url: string) => {
      if (!navigator.share || !url) {
          alert('Web Share API is not available in your browser.');
          return;
      }
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], 'edited-image.png', { type: blob.type });

        await navigator.share({
            title: 'AI Edited Image',
            text: 'Check out this image I edited with AI!',
            files: [file],
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
  };

  const handleUpscale = async (url: string, scaleFactor: 2 | 4) => {
    dispatch({ type: 'UPSCALE_START', payload: url });
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `image-to-upscale.png`, { type: blob.type });

      const { imageUrls } = await upscaleImage(file, scaleFactor);

      if (imageUrls.length > 0) {
        const newUrl = imageUrls[0];
        const compressedUrl = await compressImage(newUrl, 0.9);
        dispatch({ type: 'UPSCALE_SUCCESS', payload: { oldUrl: url, newUrl: compressedUrl } });
      } else {
        throw new Error("Upscale service did not return an image.");
      }
    } catch (err) {
      console.error('Upscale failed:', err);
      const errorMessage = err instanceof Error ? err.message : t('upscale_failed');
      dispatch({ type: 'UPSCALE_ERROR', payload: errorMessage });
    }
  };

  const StatusDisplay = () => {
      if (status === 'loading' && !upscalingUrl) return <div className="text-center"><Spinner /><p className="mt-4 text-lg text-gray-600 dark:text-gray-300 animate-pulse">{t('loading_text')}</p></div>
      if (status === 'error' && error) return <div className="text-center text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg"><XCircleIcon className="mx-auto h-10 w-10 mb-2"/><p className="font-semibold">{t('error_title')}</p><p>{error}</p></div>
      if (!activeImage) return <div className="text-center text-gray-400 dark:text-gray-500"><SparklesIcon className="mx-auto h-12 w-12"/><p className="mt-4 text-lg">{t('output_placeholder')}</p></div>
      return null;
  }

  const ImageResult = ({ url, title }: { url: string; title: string }) => {
    const isUpscaling = upscalingUrl === url;

    return (
        <div className="relative group">
            <img src={url} alt={title} className={`rounded-lg shadow-md aspect-square object-contain w-full transition-opacity ${isUpscaling ? 'opacity-50' : 'cursor-pointer'}`} onClick={() => !isUpscaling && dispatch({type: 'SET_MODAL_IMAGE', payload: url})} />
            
            {isUpscaling ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-lg">
                <Spinner />
                <p className="text-white text-sm mt-2">{t('upscaling_button')}</p>
              </div>
            ) : (
              <div className="absolute bottom-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center bg-black/50 rounded-full text-white text-xs font-bold">
                      <button onClick={() => handleUpscale(url, 2)} className="px-3 py-2 hover:bg-purple-600 rounded-l-full transition-colors" title={t('upscale_2x_tooltip')}>x2</button>
                      <div className="w-px h-4 bg-white/30"></div>
                      <button onClick={() => handleUpscale(url, 4)} className="px-3 py-2 hover:bg-purple-600 rounded-r-full transition-colors" title={t('upscale_4x_tooltip')}>x4</button>
                  </div>
                  <button onClick={() => handleDownload(url, `${title.toLowerCase().replace(' ','-')}-${Date.now()}.png`)} className="p-2 bg-black/50 text-white rounded-full hover:bg-green-600 transition-colors" title={t('download_button')}>
                    <DownloadIcon className="w-4 h-4" />
                  </button>
                  {navigator.share && <button onClick={() => handleShare(url)} className="p-2 bg-black/50 text-white rounded-full hover:bg-blue-600" title={t('share_button')}><ShareIcon className="w-4 h-4" /></button>}
              </div>
            )}
        </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-full flex-grow flex flex-col items-center justify-center">
            {status === 'error' && error ? (
                <StatusDisplay />
            ) : !activeImage ? (
                 <StatusDisplay />
            ) : (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="text-center">
                    <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('original_title')}</h3>
                    <img src={activeImage.url} alt="Original" className="rounded-lg shadow-md aspect-square object-contain mx-auto cursor-pointer" onClick={() => dispatch({type: 'SET_MODAL_IMAGE', payload: activeImage.url})} />
                </div>
                <div className="text-center">
                    <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('result_title')}</h3>
                    {(status === 'loading' && !upscalingUrl) ? (
                        <div className="aspect-square bg-gray-200 dark:bg-gray-700/50 rounded-lg flex items-center justify-center"><Spinner /></div> 
                    ) : editedUrls.length > 0 ? (
                        <div className={`grid gap-2 ${editedUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {/* FIX: Using a more stable and unique key for list items. */}
                            {editedUrls.map((url, i) => <ImageResult key={`${url}-${i}`} url={url} title={t('result_title')} />)}
                        </div>
                    ) : ( <div className="aspect-square bg-gray-200 dark:bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-500">{t('awaiting_generation')}</div> )}
                </div>
            </div>
            )}
        </div>
    </div>
  );
};

export default OutputPanel;