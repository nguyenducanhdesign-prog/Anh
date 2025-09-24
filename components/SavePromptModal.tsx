import React, { useState } from 'react';
import { useTranslation } from '../i18n';

interface SavePromptModalProps {
  currentPrompt: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

const SavePromptModal: React.FC<SavePromptModalProps> = ({ currentPrompt, onClose, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{t('save_prompt_to_library')}</h2>
        
        <div>
          <label htmlFor="prompt-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('prompt_name')}</label>
          <input
            id="prompt-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('prompt_name_placeholder')}
            className="mt-1 block w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            autoFocus
          />
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Prompt:</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md max-h-24 overflow-y-auto">{currentPrompt}</p>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            {t('cancel_button')}
          </button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-300 dark:disabled:bg-purple-800 disabled:cursor-not-allowed">
            {t('save_button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePromptModal;
