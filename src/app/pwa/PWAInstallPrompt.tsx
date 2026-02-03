/**
 * @file PWA 安装提示组件
 * @description 提示用户安装 PWA 应用
 * @component PWAInstallPrompt
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-31
 */

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        if (process.env.NODE_ENV === 'development') {
          console.info('PWA installed');
        }
      }
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  const handleDismiss = () => {
    setShowInstall(false);
  };

  if (isInstalled || !showInstall || !deferredPrompt) {
    return null;
  }

  return (
    <AlertDialog open={showInstall} onOpenChange={setShowInstall}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            安装 YYC³ NAS-ECS
          </AlertDialogTitle>
          <AlertDialogDescription>
            将 YYC³ NAS-ECS 安装到您的设备上，享受更好的体验。
            安装后，您可以：
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
              <li>在主屏幕上快速访问</li>
              <li>离线使用部分功能</li>
              <li>获得更快的加载速度</li>
              <li>接收推送通知</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>
            <X className="mr-2 h-4 w-4" />
            暂不安装
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            立即安装
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
