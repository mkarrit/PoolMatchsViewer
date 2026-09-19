import { useCallback, useEffect, useRef, useState } from 'react';
import { appConfig } from '../utils/config';

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(0);
  const timeoutsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = appConfig.ui.toastDuration) => {
      // Compteur incrémental : Date.now() produisait des clés React en double
      // quand deux toasts partaient dans la même milliseconde.
      const id = nextIdRef.current++;
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      const timeoutId = setTimeout(() => {
        timeoutsRef.current.delete(id);
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
      timeoutsRef.current.set(id, timeoutId);

      return id;
    },
    []
  );

  // Purge des minuteries en attente au démontage.
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  return { toasts, addToast, removeToast };
}
