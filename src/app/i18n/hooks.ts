/**
 * @file 国际化 Hook
 * @description 提供便捷的国际化 Hook
 * @module i18n/hooks
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-31
 */

import { useTranslation as useI18next } from 'react-i18next';
import { useCallback } from 'react';
import { supportedLanguages } from './config';

export const useI18n = () => {
  const { t, i18n } = useI18next();

  const changeLanguage = useCallback((langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  }, [i18n]);

  const getCurrentLanguage = useCallback(() => {
    return supportedLanguages.find((lang) => lang.code === i18n.language);
  }, [i18n.language]);

  const isRTL = useCallback(() => {
    return i18n.dir() === 'rtl';
  }, [i18n]);

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(i18n.language, options).format(value);
    },
    [i18n.language]
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
    },
    [i18n.language]
  );

  const formatCurrency = useCallback(
    (value: number, currency: string = 'USD') => {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency,
      }).format(value);
    },
    [i18n.language]
  );

  const formatRelativeTime = useCallback(
    (value: number, unit: Intl.RelativeTimeFormatUnit) => {
      return new Intl.RelativeTimeFormat(i18n.language).format(value, unit);
    },
    [i18n.language]
  );

  return {
    t,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    isRTL,
    formatNumber,
    formatDate,
    formatCurrency,
    formatRelativeTime,
    supportedLanguages,
  };
};

export const useTranslation = useI18n;
