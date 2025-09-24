import React from 'react';
import { XCircleIcon } from './Icons';
import { UploadedImage } from '../App';
import { useTranslation } from '../i18n';

interface UploadedImagesProps {
  images: UploadedImage[];
  activeImageUrl: string | undefined;
  dispatch: React.Dispatch<any>;
}

const UploadedImages: React.FC<UploadedImagesProps> = ({ images, activeImageUrl, dispatch }) => {
  const { t } = useTranslation();
  if (images.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('your_images')}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {images.map(image => (
          <div key={image.url} className="flex flex-col gap-2">
            <div className="relative group aspect-square">
                <img
                src={image.url}
                alt={image.name || "Uploaded thumbnail"}
                onClick={() => dispatch({ type: 'SET_ACTIVE_IMAGE', payload: image })}
                className={`w-full h-full object-cover rounded-lg cursor-pointer transition-all ${
                    activeImageUrl === image.url
                    ? 'ring-4 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800'
                    : 'hover:opacity-80'
                }`}
                />
                <button
                onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'REMOVE_IMAGE', payload: image.url });
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                title={t('remove_image')}
                >
                <XCircleIcon className="w-5 h-5" />
                </button>
            </div>
            <input 
                type="text"
                value={image.name}
                onChange={(e) => dispatch({ type: 'SET_IMAGE_NAME', payload: { url: image.url, name: e.target.value }})}
                placeholder={t('image_name_placeholder')}
                className="w-full text-xs p-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-purple-500"
                onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedImages;