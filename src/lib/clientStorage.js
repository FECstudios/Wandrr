// Import React hooks for the custom hook
import { useState, useEffect, useCallback } from 'react';

/**
 * Client-side storage utilities that safely handle SSR/CSR differences
 * Prevents localStorage/sessionStorage access during server-side rendering
 */

/**
 * Check if we're running on the client side
 * @returns {boolean} True if running in browser
 */
export function isClient() {
  return typeof window !== 'undefined';
}

/**
 * Safely get item from localStorage
 * @param {string} key - Storage key
 * @param {string} defaultValue - Default value if key doesn't exist
 * @returns {string|null} Stored value or default
 */
export function getStorageItem(key, defaultValue = null) {
  if (!isClient()) {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {boolean} True if successful
 */
export function setStorageItem(key, value) {
  if (!isClient()) {
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} True if successful
 */
export function removeStorageItem(key) {
  if (!isClient()) {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely clear all localStorage
 * @returns {boolean} True if successful
 */
export function clearStorage() {
  if (!isClient()) {
    return false;
  }
  
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Get and parse JSON from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist or parsing fails
 * @returns {any} Parsed value or default
 */
export function getStorageJSON(key, defaultValue = null) {
  const item = getStorageItem(key);
  
  if (item === null) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse JSON from localStorage "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Stringify and set JSON to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to stringify and store
 * @returns {boolean} True if successful
 */
export function setStorageJSON(key, value) {
  try {
    const jsonString = JSON.stringify(value);
    return setStorageItem(key, jsonString);
  } catch (error) {
    console.warn(`Failed to stringify and set localStorage "${key}":`, error);
    return false;
  }
}

/**
 * Hook for safe localStorage access in React components
 * @param {string} key - Storage key
 * @param {string} defaultValue - Default value
 * @returns {[string|null, Function]} [value, setValue]
 */
export function useLocalStorage(key, defaultValue = null) {
  const [value, setValue] = useState(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Only run on client side
    if (isClient()) {
      const storedValue = getStorageItem(key, defaultValue);
      setValue(storedValue);
      setIsInitialized(true);
    }
  }, [key, defaultValue]);
  
  const updateValue = useCallback((newValue) => {
    setValue(newValue);
    if (newValue === null) {
      removeStorageItem(key);
    } else {
      setStorageItem(key, newValue);
    }
  }, [key]);
  
  return [isInitialized ? value : defaultValue, updateValue, isInitialized];
}