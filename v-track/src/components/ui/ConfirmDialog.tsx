"use client";

import { useState, createContext, useContext, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
}

interface ConfirmDialogContextType {
  confirm: (config: ConfirmDialogConfig) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmDialogConfig | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = (config: ConfirmDialogConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(config);
      setResolver(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolver) {
      resolver(true);
    }
    handleClose();
  };

  const handleCancel = () => {
    if (resolver) {
      resolver(false);
    }
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setConfig(null);
    setResolver(null);
  };

  const getVariantStyles = () => {
    switch (config?.variant) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          iconColor: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          borderColor: 'border-blue-200'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && config && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className={`p-6 border-l-4 ${styles.borderColor}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {config.message}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {config.cancelText || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${styles.confirmButton}`}
              >
                {config.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (context === undefined) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
}