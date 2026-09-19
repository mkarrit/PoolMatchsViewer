import React, { useEffect, useRef, useState } from 'react';

const TYPE_STYLES = {
  success: 'bg-green-600 border-green-500',
  error: 'bg-red-600 border-red-500',
  warning: 'bg-yellow-600 border-yellow-500',
  info: 'bg-blue-600 border-blue-500',
};

const TYPE_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const EXIT_ANIMATION_MS = 300;

export function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // requestAnimationFrame plutôt qu'un setTimeout : l'animation d'entrée
    // démarre dès la première frame après le montage.
    const frameId = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Toute minuterie de sortie encore en vol doit être annulée au démontage.
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleClose = () => {
    setIsVisible(false);
    timeoutRef.current = setTimeout(onClose, EXIT_ANIMATION_MS);
  };

  const typeStyles = TYPE_STYLES[toast.type] ?? TYPE_STYLES.info;
  const icon = TYPE_ICONS[toast.type] ?? TYPE_ICONS.info;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${typeStyles}
        text-white px-4 py-3 rounded-lg shadow-lg border-l-4 min-w-[300px] max-w-[400px]
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">{icon}</span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
        <button
          onClick={handleClose}
          className="ml-2 text-white hover:text-gray-200 font-bold text-lg leading-none"
          aria-label="Fermer la notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
