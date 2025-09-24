import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon, XCircleIcon } from './Icons';
import { AppState, UploadedImage } from '../App';
import { useTranslation } from '../i18n';
import { describeImage } from '../services/geminiService';
import { Spinner } from './Spinner';

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="px-3 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-purple-200 dark:hover:bg-purple-600 transition-colors disabled:opacity-50"
            disabled={!textToCopy || copied}
        >
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
};

// FIX: Define the ReferenceImagePanelProps interface to resolve the TypeScript error.
interface ReferenceImagePanelProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

const ReferenceImagePanel: React.FC<ReferenceImagePanelProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();
  const { referenceImage } = state;

  const [isDescribing, setIsDescribing] = useState(false);
  const [description, setDescription] = useState<{ english: string; vietnamese: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateDescription = useCallback(async (file: File) => {
    setIsDescribing(true);
    setError(null);
    setDescription(null);
    try {
      const desc = await describeImage(file);
      setDescription(desc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate description.");
    } finally {
      setIsDescribing(false);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const newImage: UploadedImage = {
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      };
      dispatch({ type: 'SET_REFERENCE_IMAGE', payload: newImage });
      generateDescription(file);
    }
  }, [dispatch, generateDescription]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
    multiple: false
  });

  const removeReference = () => {
    dispatch({ type: 'SET_REFERENCE_IMAGE', payload: null });
    setDescription(null);
    setError(null);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4">
       <h2 className="text-xl font-bold flex items-center">
            <UploadIcon className="w-6 h-6 mr-2" />
            {t('reference_image')}
        </h2>
      {referenceImage ? (
        <div className="relative group">
          <img src={referenceImage.url} alt="Reference" className="w-full rounded-lg" />
          <button
            onClick={removeReference}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title={t('remove_reference')}
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}
        >
          <input {...getInputProps()} />
          <UploadIcon className="w-8 h-8 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('upload_reference_placeholder')}</p>
        </div>
      )}
      
      {referenceImage && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {isDescribing && (
                <div className="flex flex-col items-center justify-center p-4 space-y-2">
                    <Spinner />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing image...</p>
                </div>
            )}
            {error && (
                <div className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}
            {description && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">AI Generated Description</h3>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">English</label>
                            <CopyButton textToCopy={description.english} />
                        </div>
                        <textarea
                            value={description.english}
                            onChange={(e) => setDescription(prev => prev ? { ...prev, english: e.target.value } : null)}
                            rows={4}
                            className="w-full text-sm p-3 bg-white dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-600 whitespace-pre-wrap font-mono resize-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-shadow max-h-32"
                            placeholder="English description..."
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase">Vietnamese</label>
                            <CopyButton textToCopy={description.vietnamese} />
                        </div>
                        <textarea
                            value={description.vietnamese}
                            onChange={(e) => setDescription(prev => prev ? { ...prev, vietnamese: e.target.value } : null)}
                            rows={4}
                            className="w-full text-sm p-3 bg-white dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-600 whitespace-pre-wrap font-mono resize-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-shadow max-h-32"
                            placeholder="Vietnamese description..."
                        />
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ReferenceImagePanel;