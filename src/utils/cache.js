import { useRef, useCallback } from 'react';

// Cache implementation using useRef
export const useCache = () => {
  const cache = useRef(new Map());

  const get = useCallback((key) => {
    return cache.current.get(key);
  }, []);

  const set = useCallback((key, value) => {
    cache.current.set(key, value);
  }, []);

  const has = useCallback((key) => {
    return cache.current.has(key);
  }, []);

  return { get, set, has };
};

// Debounce implementation
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}; 