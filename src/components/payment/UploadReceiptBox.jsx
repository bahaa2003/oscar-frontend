import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileImage } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const UploadReceiptBox = ({ onFileSelect, selectedFile, onRemove }) => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">رفع إيصال التحويل</h3>

      {!selectedFile ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 transition-colors bg-black/20"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">اسحب وأفلت الصورة هنا</p>
          <p className="text-gray-400 text-sm mb-4">أو انقر لاختيار ملف</p>
          <p className="text-gray-500 text-xs">امتدادات PNG/JPG حتى 5MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400/20 to-pink-500/20 rounded-lg flex items-center justify-center">
              <FileImage className="w-8 h-8 text-orange-400" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-white font-medium truncate">{selectedFile.name}</p>
              <p className="text-gray-400 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={onRemove}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Receipt preview"
              className="w-full max-h-48 object-contain rounded-lg bg-black/20"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UploadReceiptBox;
