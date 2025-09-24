import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Handle QuotaExceededError by logging an error, but not attempting to prune the data.
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
        console.error(
          `LocalStorage quota exceeded for key "${key}". ` +
          `The data could not be saved. Please clear some history to save new items.`
        );
      } else {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    }
  };

  return [storedValue, setValue];
}