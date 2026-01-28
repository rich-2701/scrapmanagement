'use client';

import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, X, Check } from 'lucide-react';

interface VisualEvidenceUploadProps {
  onImageSelect?: (file: File | null) => void;
  value?: File | null;
}

export const VisualEvidenceUpload: React.FC<VisualEvidenceUploadProps> = ({ onImageSelect, value }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(value || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Call parent callback
      if (onImageSelect) {
        onImageSelect(file);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageSelect) {
      onImageSelect(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
        <Camera size={16} className="text-blue-600" />
        Visual Evidence
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {selectedImage && previewUrl ? (
        <div className="relative border-2 border-green-300 bg-green-50/50 rounded-xl p-4 group">
          <div className="absolute top-2 right-2 z-20">
            <button
              onClick={handleRemoveImage}
              className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src={previewUrl}
                alt="Evidence"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Check size={16} className="text-green-600" />
                <p className="font-semibold text-slate-700 text-sm">Image Selected</p>
              </div>
              <p className="text-xs text-slate-500 truncate">{selectedImage.name}</p>
              <p className="text-xs text-slate-400">{(selectedImage.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Camera size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Tap to Upload Photo</p>
              <p className="text-xs text-blue-600 font-medium mt-1 flex items-center justify-center gap-1">
                <UploadCloud size={12} />
                AI Analysis Enabled
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
