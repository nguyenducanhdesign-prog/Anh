import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { SparklesIcon, MicrophoneIcon, CameraIcon, BookmarkIcon } from './Icons';
import { AppState, UploadedImage } from '../App';
import UploadedImages from './UploadedImages';
import SettingsPanel from './SettingsPanel';
import { useTranslation } from '../i18n';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { generateQuickActions } from '../services/geminiService';
import { Spinner } from './Spinner';

interface InputPanelProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
  onSubmit: () => void;
}

const PresetButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({onClick, children}) => (
    <button onClick={onClick} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors">
        {children}
    </button>
);


const InputPanel: React.FC<InputPanelProps> = ({ state, dispatch, onSubmit }) => {
  const { prompt, status } = state;
  const { t, language } = useTranslation();
  const { isListening, transcript, start, stop } = useVoiceRecognition(language === 'vi' ? 'vi-VN' : 'en-US');

  const [quickActions, setQuickActions] = useState<{title: string, prompt: string}[]>([]);
  const [isLoadingInitialActions, setIsLoadingInitialActions] = useState(true);
  const [isLoadingMoreActions, setIsLoadingMoreActions] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);


  useEffect(() => {
    if (transcript) {
      dispatch({ type: 'SET_PROMPT', payload: transcript });
    }
  }, [transcript, dispatch]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: UploadedImage[] = acceptedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    dispatch({ type: 'ADD_IMAGES', payload: newImages });
    if (!state.activeImage && newImages.length > 0) {
      dispatch({ type: 'SET_ACTIVE_IMAGE', payload: newImages[0] });
    }
  }, [dispatch, state.activeImage]);
  
  // Fetch initial quick actions
  useEffect(() => {
    const getInitialActions = async () => {
        setIsLoadingInitialActions(true);
        setActionsError(null);
        setQuickActions([]);
        try {
            const newActions = await generateQuickActions(state.activeImage?.file);
            setQuickActions(newActions);
        } catch (err) {
            setActionsError(err instanceof Error ? err.message : t('actions_error'));
        } finally {
            setIsLoadingInitialActions(false);
        }
    };
    getInitialActions();
  }, [state.activeImage, t]);

  const handleLoadMore = async () => {
      setIsLoadingMoreActions(true);
      setActionsError(null);
      try {
          const existingPrompts = quickActions.map(qa => qa.prompt);
          const newActions = await generateQuickActions(state.activeImage?.file, existingPrompts);
          const uniqueNewActions = newActions.filter(
              newAction => !existingPrompts.includes(newAction.prompt)
          );
          setQuickActions(prev => [...prev, ...uniqueNewActions]);
      } catch (err) {
          setActionsError(err instanceof Error ? err.message : t('actions_error'));
      } finally {
          setIsLoadingMoreActions(false);
      }
  };


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
    multiple: true
  });
  
  const handlePresetClick = (presetPrompt: string) => {
    // Trim existing prompt and remove any trailing comma for clean concatenation
    const trimmedPrompt = state.prompt.trim().replace(/,$/, '').trim();

    const newPrompt = trimmedPrompt
      ? `${trimmedPrompt}, ${presetPrompt}`
      : presetPrompt;
      
    dispatch({ type: 'SET_PROMPT', payload: newPrompt });
    dispatch({ type: 'RECORD_PROMPT_STATE' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
      <div className="flex gap-4 items-stretch">
        <div
            {...getRootProps()}
            className={`flex-grow p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors flex flex-col justify-center items-center
            ${isDragActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'}`}
        >
            <input {...getInputProps()} />
            <p className="text-gray-500 dark:text-gray-400">{t('upload_placeholder')}</p>
        </div>
        <button 
          onClick={() => dispatch({type: 'TOGGLE_WEBCAM'})}
          className="p-4 border-2 border-dashed rounded-xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
          title={t('use_camera')}
        >
            <CameraIcon className="w-8 h-8" />
            <span className="mt-2 text-sm">{t('camera')}</span>
        </button>
      </div>

      <UploadedImages
        images={state.uploadedImages}
        activeImageUrl={state.activeImage?.url}
        dispatch={dispatch}
      />
      
      <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('quick_actions')}</label>
          {isLoadingInitialActions ? (
              <div className="flex items-center justify-center p-4">
                  <Spinner />
              </div>
          ) : (
            <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                    <PresetButton key={`${action.prompt}-${index}`} onClick={() => handlePresetClick(action.prompt)}>
                        {action.title}
                    </PresetButton>
                ))}
                <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMoreActions}
                    className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors flex items-center disabled:opacity-70 disabled:cursor-wait"
                >
                    {isLoadingMoreActions ? (
                        <>
                            <Spinner className="w-4 h-4 mr-2" />
                            <span>{t('generating_actions')}</span>
                        </>
                    ) : (
                        <span>{t('generate_more')}</span>
                    )}
                </button>
            </div>
          )}
          {actionsError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{actionsError}</p>}
      </div>

      <div className="relative">
        <textarea
          rows={3}
          value={prompt}
          onBlur={() => dispatch({ type: 'RECORD_PROMPT_STATE' })}
          onChange={(e) => dispatch({ type: 'SET_PROMPT', payload: e.target.value })}
          placeholder={t('prompt_placeholder')}
          className="w-full p-4 pr-28 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          disabled={status === 'loading'}
        />
        <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center space-x-2">
            <button
                onClick={() => dispatch({ type: 'TOGGLE_SAVE_PROMPT_MODAL' })}
                className="p-2 rounded-full transition-colors text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('save_prompt')}
                disabled={status === 'loading' || !prompt.trim()}
            >
                <BookmarkIcon className="w-5 h-5" />
            </button>
            <button
            onClick={isListening ? stop : start}
            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            title={isListening ? t('stop_mic') : t('use_mic')}
            disabled={status === 'loading'}
            >
            <MicrophoneIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      
      <SettingsPanel state={state} dispatch={dispatch} />

      <button
        onClick={onSubmit}
        disabled={status === 'loading' || !prompt || !state.activeImage}
        className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        <SparklesIcon className="w-5 h-5 mr-2" />
        {status === 'loading' ? t('generating_button') : t('generate_button')}
      </button>
    </div>
  );
};

export default InputPanel;