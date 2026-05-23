import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const PaymentMethods = ({ onSelect, onEdit, onDelete }) => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';

  const [methods] = useState([
    {
      id: 'vodafone',
      name: 'فودافون كاش',
      type: 'mobile_wallet',
      accountNumber: '01012345678',
      isActive: true,
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'etisalat',
      name: 'اتصالات كاش',
      type: 'mobile_wallet',
      accountNumber: '01112345678',
      isActive: true,
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'orange',
      name: 'أورانج كاش',
      type: 'mobile_wallet',
      accountNumber: '01212345678',
      isActive: true,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'bank',
      name: 'تحويل بنكي',
      type: 'bank_transfer',
      accountNumber: 'EG123456789012345678901234567890',
      bankName: 'البنك الأهلي المصري',
      isActive: true,
      color: 'from-blue-500 to-purple-500'
    }
  ]);

  return (
    <div className="space-y-4">
      {methods.map((method, index) => (
        <motion.div
          key={method.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          onClick={() => onSelect && onSelect(method)}
        >
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{method.name}</h3>
                <p className="text-gray-400 text-sm">{method.accountNumber}</p>
                {method.bankName && (
                  <p className="text-gray-500 text-xs">{method.bankName}</p>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                method.isActive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {method.isActive ? 'نشط' : 'معطل'}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PaymentMethods;