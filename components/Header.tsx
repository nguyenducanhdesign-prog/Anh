import React from 'react';
import { MoonIcon, SunIcon, SaveIcon, FolderOpenIcon } from './Icons';
// FIX: Added .ts extension to fix module resolution error.
import { useTranslation } from '../i18n.ts';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSaveSession: () => void;
  onLoadSession: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, onSaveSession, onLoadSession }) => {
  const { t, setLanguage, language } = useTranslation();
  const loadInputRef = React.useRef<HTMLInputElement>(null);

  const handleLoadClick = () => {
    loadInputRef.current?.click();
  };

  return (
    <header className="flex justify-between items-center mb-8">
      <div className="flex-1">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-500">
            {t('title')}
          </span>
        </h1>
        <p className="mt-2 text-sm md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
          {t('subtitle')}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <input type="file" ref={loadInputRef} onChange={onLoadSession} accept=".json" className="hidden" />
        <button
          onClick={handleLoadClick}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('load_session')}
          title={t('load_session')}
        >
          <FolderOpenIcon className="w-6 h-6" />
        </button>
        <button
          onClick={onSaveSession}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('save_session')}
          title={t('save_session')}
        >
          <SaveIcon className="w-6 h-6" />
        </button>

        <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-full p-1">
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm rounded-full ${language === 'en' ? 'bg-white dark:bg-gray-600' : ''}`}>{t('lang_en')}</button>
            <button onClick={() => setLanguage('vi')} className={`px-3 py-1 text-sm rounded-full ${language === 'vi' ? 'bg-white dark:bg-gray-600' : ''}`}>{t('lang_vi')}</button>
        </div>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
};

export default Header;