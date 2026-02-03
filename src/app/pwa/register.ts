/**
 * @file PWA 注册
 * @description 注册 Service Worker 和 PWA 功能
 * @module pwa/register
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-31
 */

import { logger } from '../utils/logger';

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.info('SW registered: ', registration);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  logger.info('New content is available; please refresh.');
                  window.dispatchEvent(new CustomEvent('sw-update-available'));
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          logger.error('SW registration failed: ', registrationError);
        });
    });
  }
};

export const unregisterSW = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      logger.info('SW unregistered');
    }
  }
};

export const skipWaiting = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });
  }
};

export const clearCache = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.active?.postMessage({ type: 'CLEAR_CACHE' });
      logger.info('Cache cleared');
    }
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const subscribeToPush = async (
  registration: ServiceWorkerRegistration,
  applicationServerKey: string
) => {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    throw error;
  }
};

export const unsubscribeFromPush = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        logger.info('Push unsubscribed');
      }
    }
  }
};
