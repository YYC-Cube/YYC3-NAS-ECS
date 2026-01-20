import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ModuleCheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const ModuleCheckbox: React.FC<ModuleCheckboxProps> = ({ 
  label, 
  checked: controlledChecked,
  onChange 
}) => {
  const [internalChecked, setInternalChecked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const checked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleChange = () => {
    const newValue = !checked;
    if (controlledChecked === undefined) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <label 
      className="flex items-center gap-3 cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
        style={{
          border: '2px solid var(--module-shadow)',
          backgroundColor: checked 
            ? 'rgba(var(--module-primary), 0.2)' 
            : 'transparent',
          boxShadow: isHovered 
            ? '0 0 0 2px rgba(var(--module-shadow), 0.3)' 
            : 'none',
        }}
        whileTap={{ scale: 0.9 }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="absolute opacity-0 w-0 h-0"
        />
        {checked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Check 
              size={14} 
              style={{ color: 'var(--module-primary)' }}
              strokeWidth={3}
            />
          </motion.div>
        )}
      </motion.div>
      <span style={{ color: 'var(--module-dark)' }}>
        {label}
      </span>
    </label>
  );
};
