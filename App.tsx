import React, { useReducer, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import HistoryPanel from './components/HistoryPanel';
import ImagePreviewModal from './components/ImagePreviewModal';
import ReferenceImagePanel from './components/ReferenceImagePanel';
import WebcamCapture from './components/WebcamCapture';
import PromptLibraryPanel from './components/PromptLibraryPanel';
import SavePromptModal from './components/SavePromptModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { editImage } from './services/geminiService';
import { useTranslation } from './i18n';

export interface UploadedImage {
  file: File;
  url: string;
  name: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  originalUrl: string;
  editedUrl: string;
  timestamp: number;
}

export interface PromptHistoryState {
    prompt: string;
    creativityLevel: number;
}

export interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  createdAt: number;
}

export interface AppState {
  status: 'idle' | 'loading' | 'success' | 'error';
  prompt: string;
  creativityLevel: number;
  uploadedImages: UploadedImage[];
  activeImage: UploadedImage | null;
  editedUrls: string[];
  error: string | null;
  history: HistoryItem[];
  modalImage: string | null;
  referenceImage: UploadedImage | null;
  isWebcamOpen: boolean;
  promptHistory: PromptHistoryState[];
  promptHistoryIndex: number;
  upscalingUrl: string | null;
  savedPrompts: SavedPrompt[];
  isSavePromptModalOpen: boolean;
}

// Interfaces for session serialization
interface SerializableUploadedImage {
  dataUrl: string;
  name: string;
}

interface SerializableSession {
  version: number;
  prompt: string;
  creativityLevel: number;
  uploadedImages: SerializableUploadedImage[];
  activeImageIndex: number;
  history: HistoryItem[];
  referenceImage: SerializableUploadedImage | null;
  savedPrompts: SavedPrompt[];
}


type Action =
  | { type: 'SET_PROMPT'; payload: string }
  // FIX: Corrected typo in action type from 'SET_CREativity_LEVEL' to 'SET_CREATIVITY_LEVEL'.
  | { type: 'SET_CREATIVITY_LEVEL'; payload: number }
  | { type: 'ADD_IMAGES'; payload: UploadedImage[] }
  | { type: 'SET_ACTIVE_IMAGE'; payload: UploadedImage | null }
  | { type: 'REMOVE_IMAGE'; payload: string } // url
  | { type: 'SET_IMAGE_NAME', payload: { url: string; name: string } }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_SUCCESS'; payload: string[] }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'CLEAR_OUTPUT' }
  | { type: 'SET_HISTORY'; payload: HistoryItem[] }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_MODAL_IMAGE'; payload: string | null }
  | { type: 'SET_REFERENCE_IMAGE'; payload: UploadedImage | null }
  | { type: 'TOGGLE_WEBCAM' }
  | { type: 'UNDO_PROMPT' }
  | { type: 'REDO_PROMPT' }
  | { type: 'RECORD_PROMPT_STATE' }
  | { type: 'UPSCALE_START', payload: string }
  | { type: 'UPSCALE_SUCCESS', payload: { oldUrl: string, newUrl: string } }
  | { type: 'UPSCALE_ERROR', payload: string }
  | { type: 'TOGGLE_SAVE_PROMPT_MODAL' }
  | { type: 'SAVE_PROMPT'; payload: { name: string; prompt: string } }
  | { type: 'DELETE_PROMPT'; payload: string } // id
  | { type: 'SET_SAVED_PROMPTS'; payload: SavedPrompt[] }
  | { type: 'RESTORE_SESSION'; payload: Partial<AppState> };


const initialState: AppState = {
  status: 'idle',
  prompt: '',
  creativityLevel: 5,
  uploadedImages: [],
  activeImage: null,
  editedUrls: [],
  error: null,
  history: [],
  modalImage: null,
  referenceImage: null,
  isWebcamOpen: false,
  promptHistory: [{ prompt: '', creativityLevel: 5 }],
  promptHistoryIndex: 0,
  upscalingUrl: null,
  savedPrompts: [],
  isSavePromptModalOpen: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload };
    case 'SET_CREATIVITY_LEVEL':
        return { ...state, creativityLevel: action.payload };
    case 'RECORD_PROMPT_STATE':
        const newHistory = state.promptHistory.slice(0, state.promptHistoryIndex + 1);
        newHistory.push({ prompt: state.prompt, creativityLevel: state.creativityLevel });
        return { ...state, promptHistory: newHistory, promptHistoryIndex: newHistory.length - 1 };
    case 'UNDO_PROMPT': {
        const newIndex = Math.max(0, state.promptHistoryIndex - 1);
        const pastState = state.promptHistory[newIndex];
        return { ...state, ...pastState, promptHistoryIndex: newIndex };
    }
    case 'REDO_PROMPT': {
        const newIndex = Math.min(state.promptHistory.length - 1, state.promptHistoryIndex + 1);
        const futureState = state.promptHistory[newIndex];
        return { ...state, ...futureState, promptHistoryIndex: newIndex };
    }
    case 'ADD_IMAGES':
      const newImages = action.payload.filter(
        (img) => !state.uploadedImages.some((existing) => existing.url === img.url)
      );
      return { ...state, uploadedImages: [...state.uploadedImages, ...newImages] };
    case 'SET_IMAGE_NAME':
        return {
            ...state,
            uploadedImages: state.uploadedImages.map(img => img.url === action.payload.url ? { ...img, name: action.payload.name } : img)
        };
    case 'SET_ACTIVE_IMAGE':
      return { ...state, activeImage: action.payload, editedUrls: [], status: 'idle', error: null };
    case 'REMOVE_IMAGE':
      const newUploaded = state.uploadedImages.filter(img => img.url !== action.payload);
      const newActive = state.activeImage?.url === action.payload ? null : state.activeImage;
      return { ...state, uploadedImages: newUploaded, activeImage: newActive };
    case 'SUBMIT':
      return { ...state, status: 'loading', error: null, editedUrls: [] };
    case 'SUBMIT_SUCCESS': {
      if (!state.activeImage) return state;
      const newHistoryItems: HistoryItem[] = action.payload.map(editedUrl => ({
        id: crypto.randomUUID(),
        prompt: state.prompt,
        originalUrl: state.activeImage!.url,
        editedUrl: editedUrl,
        timestamp: Date.now(),
      }));
      const updatedHistory = [...newHistoryItems, ...state.history];
      return {
        ...state,
        status: 'success',
        editedUrls: action.payload,
        history: updatedHistory,
      };
    }
    case 'SUBMIT_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'CLEAR_OUTPUT':
        return { ...state, editedUrls: [], status: 'idle', error: null };
    case 'SET_HISTORY':
        return { ...state, history: action.payload };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'SET_MODAL_IMAGE':
      return { ...state, modalImage: action.payload };
    case 'SET_REFERENCE_IMAGE':
        return { ...state, referenceImage: action.payload };
    case 'TOGGLE_WEBCAM':
        return { ...state, isWebcamOpen: !state.isWebcamOpen };
    case 'UPSCALE_START':
        return { ...state, status: 'loading', upscalingUrl: action.payload, error: null };
    case 'UPSCALE_SUCCESS':
        const { oldUrl, newUrl } = action.payload;
        const newEditedUrls = state.editedUrls.map(url => url === oldUrl ? newUrl : url);
        const updatedHistory = state.history.map(item => {
            if (item.editedUrl === oldUrl) {
                return { ...item, editedUrl: newUrl };
            }
            return item;
        });
        return { 
            ...state, 
            status: 'success', 
            upscalingUrl: null, 
            editedUrls: newEditedUrls,
            history: updatedHistory 
        };
    case 'UPSCALE_ERROR':
        return { ...state, status: 'error', upscalingUrl: null, error: action.payload };
    case 'TOGGLE_SAVE_PROMPT_MODAL':
      return { ...state, isSavePromptModalOpen: !state.isSavePromptModalOpen };
    case 'SAVE_PROMPT': {
      const newPrompt: SavedPrompt = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        prompt: action.payload.prompt,
        createdAt: Date.now(),
      };
      return { ...state, savedPrompts: [newPrompt, ...state.savedPrompts] };
    }
    case 'DELETE_PROMPT':
      return { ...state, savedPrompts: state.savedPrompts.filter(p => p.id !== action.payload) };
    case 'SET_SAVED_PROMPTS':
      return { ...state, savedPrompts: action.payload };
    case 'RESTORE_SESSION':
      // Before restoring, revoke old blob URLs to prevent memory leaks
      state.uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
      if (state.referenceImage) {
        URL.revokeObjectURL(state.referenceImage.url);
      }
      return {
        ...initialState,
        ...action.payload,
        history: action.payload.history || [],
        savedPrompts: action.payload.savedPrompts || [],
        promptHistory: [{
          prompt: action.payload.prompt || '',
          creativityLevel: action.payload.creativityLevel || 5
        }],
        promptHistoryIndex: 0,
      };
    default:
      return state;
  }
}

// Helper to convert a File to a base64 data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to convert a data URL back to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};


function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('edit-history', []);
  const [savedPrompts, setSavedPrompts] = useLocalStorage<SavedPrompt[]>('prompt-library', []);
  const { t } = useTranslation();

  useEffect(() => {
      dispatch({ type: 'SET_HISTORY', payload: history });
      dispatch({ type: 'SET_SAVED_PROMPTS', payload: savedPrompts });
  }, []); 

  useEffect(() => {
      setHistory(state.history);
  }, [state.history, setHistory]);

  useEffect(() => {
    setSavedPrompts(state.savedPrompts);
  }, [state.savedPrompts, setSavedPrompts]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Global keydown listener for Ctrl+Z undo functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        if (state.promptHistoryIndex > 0) {
          dispatch({ type: 'UNDO_PROMPT' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, state.promptHistoryIndex]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = async () => {
    if (!state.prompt || !state.activeImage) {
      dispatch({ type: 'SUBMIT_ERROR', payload: 'Please select an image and enter a prompt.' });
      return;
    }

    dispatch({ type: 'SUBMIT' });

    try {
      const { imageUrls } = await editImage(
        state.prompt, 
        state.activeImage.file, 
        state.creativityLevel / 10, // Scale 0-10 to 0-1 for temperature
        state.referenceImage?.file
      );
      
      // Compress images to JPEG to save space in localStorage
      const compressedUrls = await Promise.all(
        imageUrls.map(url => compressImage(url, 0.9))
      );
      
      dispatch({ type: 'SUBMIT_SUCCESS', payload: compressedUrls });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      dispatch({ type: 'SUBMIT_ERROR', payload: errorMessage });
    }
  };
  
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
        if (item.type.startsWith('image')) {
            const file = item.getAsFile();
            if (file) {
                const newImage: UploadedImage = {
                    file,
                    url: URL.createObjectURL(file),
                    name: `pasted-${Date.now()}`
                };
                dispatch({ type: 'ADD_IMAGES', payload: [newImage] });
                 if (!state.activeImage) {
                    dispatch({ type: 'SET_ACTIVE_IMAGE', payload: newImage });
                }
            }
            break; 
        }
    }
  }, [dispatch, state.activeImage]);
  
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
        window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleSaveSession = useCallback(async () => {
    try {
      const serializableUploadedImages = await Promise.all(
        state.uploadedImages.map(async (img) => ({
          dataUrl: await fileToDataURL(img.file),
          name: img.name,
        }))
      );
      
      let serializableReferenceImage: SerializableUploadedImage | null = null;
      if (state.referenceImage) {
        serializableReferenceImage = {
          dataUrl: await fileToDataURL(state.referenceImage.file),
          name: state.referenceImage.name,
        };
      }
      
      const activeImageIndex = state.activeImage 
        ? state.uploadedImages.findIndex(img => img.url === state.activeImage?.url) 
        : -1;

      const sessionData: SerializableSession = {
        version: 1,
        prompt: state.prompt,
        creativityLevel: state.creativityLevel,
        uploadedImages: serializableUploadedImages,
        activeImageIndex,
        history: state.history,
        referenceImage: serializableReferenceImage,
        savedPrompts: state.savedPrompts,
      };
      
      const dataStr = JSON.stringify(sessionData, null, 2);
      const blob = new Blob([dataStr], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `ai-image-editor-session-${Date.now()}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to save session:", error);
      dispatch({ type: 'SUBMIT_ERROR', payload: "Error saving session. See console for details." });
    }
  }, [state]);

  const handleLoadSession = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("Invalid file content");
            const sessionData = JSON.parse(text) as SerializableSession;

            if (sessionData.version !== 1) {
                throw new Error("Unsupported session version.");
            }
            
            const newUploadedImages: UploadedImage[] = sessionData.uploadedImages.map(sImg => {
                const file = dataURLtoFile(sImg.dataUrl, sImg.name);
                return { file, url: URL.createObjectURL(file), name: sImg.name };
            });
            
            let newReferenceImage: UploadedImage | null = null;
            if (sessionData.referenceImage) {
                const file = dataURLtoFile(sessionData.referenceImage.dataUrl, sessionData.referenceImage.name);
                newReferenceImage = { file, url: URL.createObjectURL(file), name: sessionData.referenceImage.name };
            }
            
            const newActiveImage = sessionData.activeImageIndex > -1 
                ? newUploadedImages[sessionData.activeImageIndex]
                : null;
            
            const restoredState: Partial<AppState> = {
                prompt: sessionData.prompt,
                creativityLevel: sessionData.creativityLevel,
                uploadedImages: newUploadedImages,
                activeImage: newActiveImage,
                history: sessionData.history,
                referenceImage: newReferenceImage,
                savedPrompts: sessionData.savedPrompts,
                status: 'idle',
                editedUrls: [],
                error: null,
            };

            dispatch({ type: 'RESTORE_SESSION', payload: restoredState });
        } catch (error) {
            console.error("Failed to load session:", error);
            dispatch({ type: 'SUBMIT_ERROR', payload: t('session_load_error') });
        } finally {
            if (event.target) {
                event.target.value = '';
            }
        }
    };
    reader.readAsText(file);
  }, [dispatch, t]);

  return (
    <div className={'min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300'}>
      <div className="container mx-auto p-4 md:p-8">
        <Header 
          theme={theme} 
          onToggleTheme={toggleTheme} 
          onSaveSession={handleSaveSession}
          onLoadSession={handleLoadSession}
        />
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <InputPanel state={state} dispatch={dispatch} onSubmit={handleSubmit} />
            <OutputPanel state={state} dispatch={dispatch} />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <HistoryPanel state={state} dispatch={dispatch} />
            <ReferenceImagePanel state={state} dispatch={dispatch} />
            <PromptLibraryPanel state={state} dispatch={dispatch} />
          </div>
        </main>
      </div>
      {state.modalImage && (
        <ImagePreviewModal
          imageUrl={state.modalImage}
          onClose={() => dispatch({ type: 'SET_MODAL_IMAGE', payload: null })}
        />
      )}
      {state.isWebcamOpen && (
          <WebcamCapture
              onClose={() => dispatch({type: 'TOGGLE_WEBCAM'})}
              onCapture={(file) => {
                  const newImage: UploadedImage = { file, url: URL.createObjectURL(file), name: `webcam-${Date.now()}` };
                  dispatch({ type: 'ADD_IMAGES', payload: [newImage]});
                  dispatch({ type: 'SET_ACTIVE_IMAGE', payload: newImage });
                  dispatch({ type: 'TOGGLE_WEBCAM' });
              }}
          />
      )}
      {state.isSavePromptModalOpen && (
        <SavePromptModal
            currentPrompt={state.prompt}
            onClose={() => dispatch({ type: 'TOGGLE_SAVE_PROMPT_MODAL' })}
            onSave={(name) => {
                dispatch({ type: 'SAVE_PROMPT', payload: { name, prompt: state.prompt } });
                dispatch({ type: 'TOGGLE_SAVE_PROMPT_MODAL' });
            }}
        />
    )}
    </div>
  );
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

export default App;