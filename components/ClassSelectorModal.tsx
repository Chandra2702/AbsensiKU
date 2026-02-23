import React from 'react';
import { Check, Users, GraduationCap } from 'lucide-react';
import { AVAILABLE_CLASSES } from '../constants';

interface ClassSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  onSelect: (className: string) => void;
  showAllOption?: boolean;
}

const ClassSelectorModal: React.FC<ClassSelectorModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedClass, 
  onSelect,
  showAllOption = true
}) => {
  if (!isOpen) return null;

  const options = showAllOption ? ['Semua Kelas', ...AVAILABLE_CLASSES] : AVAILABLE_CLASSES;

  return (
    <>
      {/* Backdrop invisible untuk menutup dropdown saat klik di luar */}
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      
      {/* Dropdown Container */}
      <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
        <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
          {options.map((option) => {
            const isSelected = selectedClass === option;
            const isAll = option === 'Semua Kelas';
            
            return (
              <button
                key={option}
                onClick={() => {
                  onSelect(option);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 group ${
                  isSelected 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-gray-400 group-hover:bg-white group-hover:text-primary'}`}>
                    {isAll ? <Users size={14} /> : <GraduationCap size={14} />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                    {option}
                  </span>
                </div>
                {isSelected && <Check size={16} className="text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ClassSelectorModal;