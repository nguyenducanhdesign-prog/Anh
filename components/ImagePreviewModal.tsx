import React, { useState, useRef, useEffect } from 'react';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.min(Math.max(0.5, scale - e.deltaY * 0.001), 4);
    setScale(newScale);
    if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
        isDragging.current = true;
        startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        e.currentTarget.classList.add('cursor-grabbing');
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    isDragging.current = false;
    e.currentTarget.classList.remove('cursor-grabbing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - startPos.current.x,
        y: e.clientY - startPos.current.y,
      });
    }
  };

  const handleReset = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-[90vh] object-contain transition-transform duration-100 ease-out cursor-grab"
          style={{ transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)` }}
        />
      </div>
       <div className="absolute top-4 right-4 flex space-x-2">
            <button onClick={handleReset} className="px-4 py-2 bg-white/20 text-white rounded-full backdrop-blur-sm hover:bg-white/30">Reset</button>
            <button onClick={onClose} className="px-4 py-2 bg-white/20 text-white rounded-full backdrop-blur-sm hover:bg-white/30">Close</button>
        </div>
    </div>
  );
};

export default ImagePreviewModal;
