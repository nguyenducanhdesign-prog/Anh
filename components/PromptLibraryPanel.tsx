import React, { useState, useRef } from 'react';
import { AppState, SavedPrompt } from '../App';
import { useTranslation } from '../i18n';
import { BookmarkIcon, SparklesIcon, XCircleIcon } from './Icons';

interface PromptLibraryPanelProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

const PromptLibraryPanel: React.FC<PromptLibraryPanelProps> = ({ state, dispatch }) => {
    const { t } = useTranslation();
    const { savedPrompts } = state;
    const [searchTerm, setSearchTerm] = useState('');
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleApply = (prompt: string) => {
        dispatch({ type: 'SET_PROMPT', payload: prompt });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('confirm_delete_prompt'))) {
            dispatch({ type: 'DELETE_PROMPT', payload: id });
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(savedPrompts, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'ai-image-editor-prompts.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };
    
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Invalid file content");
                const importedPrompts = JSON.parse(text) as SavedPrompt[];
                
                // Basic validation
                if (!Array.isArray(importedPrompts) || !importedPrompts.every(p => 'id' in p && 'name' in p && 'prompt' in p)) {
                    throw new Error("Invalid file format.");
                }

                if (window.confirm(t('confirm_import'))) {
                    // Merge strategy: Add new prompts, ignore existing IDs.
                    const existingIds = new Set(savedPrompts.map(p => p.id));
                    const uniqueImported = importedPrompts.filter(p => !existingIds.has(p.id));
                    const updatedLibrary = [...uniqueImported, ...savedPrompts];
                    dispatch({ type: 'SET_SAVED_PROMPTS', payload: updatedLibrary });
                }

            } catch (error) {
                alert(`Error importing file: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                // Reset file input
                if (importInputRef.current) {
                    importInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const filteredPrompts = savedPrompts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                    <BookmarkIcon className="w-6 h-6 mr-2" />
                    {t('prompt_library_title')}
                </h2>
                <div className="flex space-x-2">
                    <input type="file" ref={importInputRef} onChange={handleImport} accept=".json" className="hidden" />
                    <button onClick={handleImportClick} className="text-sm text-blue-500 hover:underline">{t('import_library')}</button>
                    <button onClick={handleExport} disabled={savedPrompts.length === 0} className="text-sm text-blue-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">{t('export_library')}</button>
                </div>
            </div>

            <div className="mb-4">
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('search_prompts_placeholder')}
                    className="w-full text-sm p-2 bg-white dark:bg-gray-900/50 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-purple-500"
                />
            </div>
            
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {filteredPrompts.length > 0 ? (
                    filteredPrompts.map(p => (
                        <div key={p.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center space-x-3 shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex-grow overflow-hidden">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={p.name}>{p.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={p.prompt}>{p.prompt}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center">
                                <button onClick={() => handleApply(p.prompt)} className="p-2 text-gray-500 hover:text-purple-500" title={t('apply_prompt')}><SparklesIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-red-500" title={t('delete_prompt')}><XCircleIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                        <BookmarkIcon className="mx-auto h-10 w-10 mb-2"/>
                        <p>{t('no_prompts_saved')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PromptLibraryPanel;
