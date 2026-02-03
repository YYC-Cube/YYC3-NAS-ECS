/**
 * @file 语言切换器组件
 * @description 提供语言切换功能的UI组件
 * @component LanguageSwitcher
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-31
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { supportedLanguages } from './config';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = supportedLanguages.find(
    (lang) => lang.code === i18n.language
  );

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
          {currentLanguage && (
            <span className="absolute -bottom-1 -right-1 text-xs">
              {currentLanguage.flag}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={i18n.language === language.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{language.flag}</span>
            <span>{language.name}</span>
            {i18n.language === language.code && (
              <span className="ml-auto">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
