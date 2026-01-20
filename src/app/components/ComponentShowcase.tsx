import React from 'react';

interface ComponentShowcaseProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const ComponentShowcase: React.FC<ComponentShowcaseProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="mb-8 bg-white p-6 rounded-lg border-l-4" style={{ borderColor: 'var(--module-shadow)' }}>
      <div className="mb-4">
        <h3 className="mb-2" style={{ color: 'var(--module-primary)' }}>
          {title}
        </h3>
        <p className="opacity-70" style={{ color: 'var(--module-dark)' }}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );
};
