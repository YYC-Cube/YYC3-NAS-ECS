/**
 * @file PWA 更新提示组件
 * @description 当有新版本可用时提示用户更新
 * @component PWAUpdatePrompt
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
import { Download, RefreshCw } from 'lucide-react';
import { skipWaiting } from './register';

export const PWAUpdatePrompt: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setShowUpdate(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await skipWaiting();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  return (
    <AlertDialog open={showUpdate} onOpenChange={setShowUpdate}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            新版本可用
          </AlertDialogTitle>
          <AlertDialogDescription>
            YYC³ NAS-ECS 有新版本可用，包含最新的功能和改进。
            点击更新按钮即可立即更新。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss} disabled={isUpdating}>
            稍后更新
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                更新中...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                立即更新
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
