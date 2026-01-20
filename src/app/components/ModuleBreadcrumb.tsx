import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ModuleBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const ModuleBreadcrumb: React.FC<ModuleBreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 px-4 py-3 rounded-md" 
      style={{ 
        /* 完整四边边框系统 */
        borderTop: '1px solid rgba(var(--module-primary), 0.15)',
        borderLeft: '3px solid var(--module-shadow)',
        borderRight: '1px solid rgba(var(--module-shadow), 0.25)',
        borderBottom: '1px solid rgba(var(--module-dark), 0.15)',
        backgroundColor: 'rgba(var(--module-light-rgb), 0.3)',
        boxShadow: '1px 1px 3px rgba(var(--module-primary), 0.08)',
      }}
    >
      {items.map((item, index) => (
        <div key={index} style={{ display: 'contents' }}>
          {index > 0 && (
            <ChevronRight 
              size={16} 
              style={{ 
                color: 'var(--module-primary)',
                opacity: 0.3 
              }} 
            />
          )}
          {item.href ? (
            <a
              href={item.href}
              className={`
                px-2 py-1 rounded transition-all duration-200
                ${index === items.length - 1 ? 'font-medium' : 'hover:font-medium'}
              `}
              style={{
                color: index === items.length - 1 
                  ? 'var(--module-primary)' 
                  : 'var(--module-dark)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (index !== items.length - 1) {
                  e.currentTarget.style.backgroundColor = 'rgba(var(--module-primary), 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.label}
            </a>
          ) : (
            <span
              className={`
                px-2 py-1 rounded transition-all duration-200
                ${index === items.length - 1 ? 'font-medium' : ''}
              `}
              style={{
                color: index === items.length - 1 
                  ? 'var(--module-primary)' 
                  : 'var(--module-dark)',
              }}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};