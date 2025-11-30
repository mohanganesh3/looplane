import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Toast Context for global access
const ToastContext = createContext(null);

// Toast types with their configurations
const TOAST_TYPES = {
  success: {
    icon: 'fa-check-circle',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    iconColor: 'text-green-500',
    textColor: 'text-green-800'
  },
  error: {
    icon: 'fa-times-circle',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    iconColor: 'text-red-500',
    textColor: 'text-red-800'
  },
  warning: {
    icon: 'fa-exclamation-triangle',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
    iconColor: 'text-amber-500',
    textColor: 'text-amber-800'
  },
  info: {
    icon: 'fa-info-circle',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800'
  }
};

// Individual Toast Component
const ToastItem = ({ id, type, message, title, onClose, duration = 5000 }) => {
  const [isExiting, setIsExiting] = useState(false);
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        flex items-start p-4 rounded-lg shadow-lg border-l-4 min-w-[320px] max-w-md
        ${config.bgColor} ${config.borderColor}
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={`flex-shrink-0 ${config.iconColor}`}>
        <i className={`fas ${config.icon} text-xl`} aria-hidden="true" />
      </div>
      <div className="ml-3 flex-1">
        {title && (
          <p className={`font-semibold ${config.textColor}`}>{title}</p>
        )}
        <p className={`text-sm ${config.textColor} ${title ? 'mt-1' : ''}`}>
          {message}
        </p>
      </div>
      <button
        onClick={handleClose}
        className={`ml-4 flex-shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
        aria-label="Close notification"
      >
        <i className="fas fa-times" aria-hidden="true" />
      </button>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div 
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, title, duration = 5000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    custom: (options) => addToast(options),
    dismiss: removeToast,
    dismissAll: () => setToasts([])
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
