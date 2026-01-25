import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface ModuleSearchBoxProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export const ModuleSearchBox: React.FC<ModuleSearchBoxProps> = ({ 
  placeholder = '搜索知识库...', 
  onSearch 
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative max-w-lg">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onSearch?.(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full px-4 py-3 pl-12 rounded-md transition-all duration-300 outline-none"
        placeholder={placeholder}
        style={{
          /* 完整四边边框系统 */
          borderTop: '1px solid rgba(var(--module-primary), 0.2)',
          borderLeft: `${isFocused ? '4px' : '3px'} solid var(--module-shadow)`,
          borderRight: `1px solid rgba(var(--module-shadow), ${isFocused ? '0.4' : '0.3'})`,
          borderBottom: `1px solid rgba(var(--module-dark), ${isFocused ? '0.3' : '0.2'})`,
          backgroundColor: 'rgba(var(--module-light-rgb), 0.2)',
          boxShadow: isFocused 
            ? '0 0 0 3px rgba(var(--module-primary), 0.2), 2px 2px 6px rgba(var(--module-primary), 0.15)' 
            : '1px 1px 3px rgba(var(--module-primary), 0.08)',
        }}
      />
      <div 
        className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300"
      >
        <Search 
          size={20} 
          style={{ 
            color: isFocused ? 'var(--module-primary)' : 'var(--module-shadow)',
            transform: isFocused ? 'scale(1.1) rotate(15deg)' : 'scale(1) rotate(0deg)',
          }}
        />
      </div>
    </div>
  );
};