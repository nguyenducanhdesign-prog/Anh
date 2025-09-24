import React from 'react';
import { HistoryIcon, XCircleIcon, ViewIcon, DownloadIcon, SparklesIcon } from './Icons';
import { AppState, HistoryItem, UploadedImage } from '../App';
import { useTranslation } from '../i18n';

interface HistoryPanelProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ state, dispatch }) => {
  const { history } = state;
  const { t } = useTranslation();

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the entire history? This cannot be undone.')) {
        dispatch({ type: 'CLEAR_HISTORY' });
    }
  }

  const handleDownload = (item: HistoryItem) => {
    const { editedUrl, prompt, timestamp } = item;
    if (!editedUrl) return;

    // Sanitize prompt for use in filename
    const safePrompt = prompt.replace(/[\W_]+/g, "-").substring(0, 50).toLowerCase() || "ai-edit";
    const filename = `${safePrompt}-${timestamp}.png`;

    const link = document.createElement('a');
    link.href = editedUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadHistoryItemForEditing = async (item: HistoryItem) => {
    try {
        const response = await fetch(item.editedUrl);
        const blob = await response.blob();
        
        const safePrompt = item.prompt.replace(/[\W_]+/g, "-").substring(0, 30).toLowerCase() || "ai-edit";
        const filename = `${safePrompt}-${item.timestamp}.png`;
        const file = new File([blob], filename, { type: 'image/png' });

        const newImage: UploadedImage = {
            file,
            url: URL.createObjectURL(file),
            name: `Edit of "${item.prompt.substring(0, 20)}..."`
        };

        dispatch({ type: 'ADD_IMAGES', payload: [newImage] });
        dispatch({ type: 'SET_ACTIVE_IMAGE', payload: newImage });
        dispatch({ type: 'SET_PROMPT', payload: '' });
        dispatch({ type: 'CLEAR_OUTPUT' });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error("Failed to load history item for editing:", error);
        dispatch({ type: 'SUBMIT_ERROR', payload: 'Failed to load image for editing.' });
    }
  };

  const HistoryItemCard: React.FC<{ item: HistoryItem }> = ({ item }) => (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center space-x-3 shadow-sm hover:shadow-md transition-shadow">
          <img src={item.editedUrl} alt="Edited thumbnail" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
          <div className="flex-grow overflow-hidden">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={item.prompt}>{item.prompt}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
          </div>
          <div className="flex-shrink-0 flex items-center">
            <button 
                onClick={() => handleLoadHistoryItemForEditing(item)}
                className="p-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                title={t('edit_this_result')}
            >
                <SparklesIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={() => dispatch({ type: 'SET_MODAL_IMAGE', payload: item.editedUrl })}
                className="p-2 text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                title={t('view_button')}
            >
                <ViewIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={() => handleDownload(item)}
                className="p-2 text-gray-500 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                title={t('download_button')}
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
          </div>
      </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
            <HistoryIcon className="w-6 h-6 mr-2" />
            {t('history_title')}
        </h2>
        {history.length > 0 && (
            <button onClick={handleClearHistory} className="text-sm text-red-500 hover:underline">{t('clear_history_button')}</button>
        )}
      </div>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {history.length > 0 ? (
          history.map(item => <HistoryItemCard key={item.id} item={item} />)
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">
            <XCircleIcon className="mx-auto h-10 w-10 mb-2"/>
            <p>{t('history_empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;