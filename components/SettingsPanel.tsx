import React from 'react';
import { AppState } from '../App';
import { useTranslation } from '../i18n';
import { UndoIcon, RedoIcon } from './Icons';

interface SettingsPanelProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();
  const { creativityLevel, promptHistory, promptHistoryIndex } = state;

  const canUndo = promptHistoryIndex > 0;
  const canRedo = promptHistoryIndex < promptHistory.length - 1;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_CREATIVITY_LEVEL', payload: parseInt(e.target.value, 10) });
  };
  
  const handleSliderMouseUp = () => {
      dispatch({ type: 'RECORD_PROMPT_STATE' });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300">{t('ai_controls')}</h3>
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => dispatch({type: 'UNDO_PROMPT'})}
                disabled={!canUndo} 
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" 
                title={t('undo')}
            >
                <UndoIcon className="w-5 h-5"/>
            </button>
            <button 
                onClick={() => dispatch({type: 'REDO_PROMPT'})}
                disabled={!canRedo} 
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed" 
                title={t('redo')}
            >
                <RedoIcon className="w-5 h-5"/>
            </button>
        </div>
      </div>
      <div>
        <label htmlFor="creativity" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('strength')}</label>
        <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500">{t('faithful')}</span>
            <input
                id="creativity"
                type="range"
                min="0"
                max="10"
                value={creativityLevel}
                onChange={handleSliderChange}
                onMouseUp={handleSliderMouseUp}
                onTouchEnd={handleSliderMouseUp}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${creativityLevel * 10}%, #e5e7eb ${creativityLevel * 10}%)`,
                }}
            />
            <span className="text-xs text-gray-500">{t('creative')}</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;