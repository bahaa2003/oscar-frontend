import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const PaymentMethodCard = ({ method, onEdit, onDelete, onToggleStatus }) => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-black/50 transition-colors"
    >
      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="text-3xl">{method.icon}</div>
          <div>
            <h3 className="text-white font-semibold text-lg">{method.name}</h3>
            <p className="text-gray-400 text-sm">{method.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                method.status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {method.status === 'active' ? 'نشط' : 'معطل'}
              </span>
              <span className="text-gray-400 text-xs">• {method.currency}</span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleStatus(method.id)}
            className={`p-2 rounded-lg ${
              method.status === 'active'
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            }`}
          >
            {method.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(method)}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          >
            <Edit className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(method.id)}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">رقم الحساب:</span>
            <p className="text-white font-mono">{method.accountNumber}</p>
          </div>
          <div>
            <span className="text-gray-400">اسم المستلم:</span>
            <p className="text-white">{method.accountName}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PaymentMethodFormModal = ({ isOpen, onClose, method, onSave }) => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';

  const [formData, setFormData] = useState(method || {
    name: '',
    description: '',
    icon: '',
    currency: 'EGP',
    accountNumber: '',
    accountName: '',
    bankName: '',
    instructions: '',
    status: 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-white text-2xl font-bold mb-6">
            {method ? 'تعديل وسيلة دفع' : 'إضافة وسيلة دفع جديدة'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">اسم الوسيلة</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">الأيقونة (emoji)</label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="📱"
                  className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">الوصف</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">العملة</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  <option value="EGP">EGP - الجنيه المصري</option>
                  <option value="USD">USD - الدولار الأمريكي</option>
                  <option value="SAR">SAR - الريال السعودي</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">الحالة</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  <option value="active">نشط</option>
                  <option value="inactive">معطل</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">رقم الحساب</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">اسم المستلم</label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">اسم البنك (اختياري)</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">تعليمات الدفع</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={3}
                className={`w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                required
              />
            </div>

            <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all"
              >
                {method ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export { PaymentMethodCard, PaymentMethodFormModal };