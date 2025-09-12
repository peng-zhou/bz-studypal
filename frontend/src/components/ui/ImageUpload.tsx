'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { questionsAPI } from '../../lib/api';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export default function ImageUpload({
  images,
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;

    // Create preview objects
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      uploaded: false
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files
    try {
      const result = await questionsAPI.uploadImages(acceptedFiles);

      if (result.success) {
        // Update uploaded files with URLs
        setUploadedFiles(prev => 
          prev.map((file, index) => {
            if (newFiles.includes(file)) {
              const uploadIndex = newFiles.indexOf(file);
              return {
                ...file,
                uploading: false,
                uploaded: true,
                url: result.data.images[uploadIndex]
              };
            }
            return file;
          })
        );

        // Update parent component with all image URLs
        const allImageUrls = [...images, ...result.data.images];
        onChange(allImageUrls);
      } else {
        // Handle upload error
        setUploadedFiles(prev => 
          prev.map(file => 
            newFiles.includes(file) 
              ? { ...file, uploading: false, error: result.error || 'Upload failed' }
              : file
          )
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => 
        prev.map(file => 
          newFiles.includes(file) 
            ? { ...file, uploading: false, error: 'Network error' }
            : file
        )
      );
    }
  }, [images, onChange, disabled]);

  const removeImage = async (imageUrl: string, isUploaded = true) => {
    if (disabled) return;

    if (isUploaded) {
      // Remove from server
      try {
        await questionsAPI.deleteImage(imageUrl);
      } catch (error) {
        console.error('Error deleting image:', error);
      }

      // Remove from images array
      const updatedImages = images.filter(url => url !== imageUrl);
      onChange(updatedImages);
    } else {
      // Remove from uploadedFiles
      setUploadedFiles(prev => prev.filter(file => file.preview !== imageUrl));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: maxFiles - images.length,
    maxSize,
    disabled
  });

  const totalImages = images.length + uploadedFiles.filter(f => f.uploaded).length;
  const canUploadMore = totalImages < maxFiles && !disabled;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="text-4xl">📷</div>
            <div className="text-sm text-gray-600">
              {isDragActive
                ? t('common.dropFilesHere')
                : t('common.dragDropOrClick')
              }
            </div>
            <div className="text-xs text-gray-500">
              {t('common.supportedFormats')}: PNG, JPG, JPEG, GIF, WEBP
            </div>
            <div className="text-xs text-gray-500">
              {t('common.maxFileSize')}: {Math.round(maxSize / 1024 / 1024)}MB, {t('common.maxFiles')}: {maxFiles}
            </div>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {(images.length > 0 || uploadedFiles.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Existing images */}
          {images.map((imageUrl, index) => (
            <div key={`existing-${index}`} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={`http://localhost:8000${imageUrl}`}
                  alt={`Question image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(imageUrl, true)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Uploading/uploaded files */}
          {uploadedFiles.map((file, index) => (
            <div key={`upload-${index}`} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={file.preview}
                  alt={`Uploading image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Upload overlay */}
                {file.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-sm">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
                      {t('common.uploading')}
                    </div>
                  </div>
                )}

                {/* Error overlay */}
                {file.error && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center">
                    <div className="text-white text-xs text-center p-2">
                      {file.error}
                    </div>
                  </div>
                )}
              </div>

              {!disabled && !file.uploading && (
                <button
                  type="button"
                  onClick={() => removeImage(file.preview, false)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload info */}
      {totalImages > 0 && (
        <div className="text-sm text-gray-500">
          {totalImages} / {maxFiles} {t('common.imagesUploaded')}
        </div>
      )}
    </div>
  );
}
