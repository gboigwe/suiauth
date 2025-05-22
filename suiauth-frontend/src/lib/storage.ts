/**
 * Gets item from localStorage with safety checks
 * @param key Storage key
 * @returns Item value or null if not found
 */
export function getLocalStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }
  
  /**
   * Sets item in localStorage with safety checks
   * @param key Storage key
   * @param value Item value
   */
  export function setLocalStorage(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage item:', error);
    }
  }
  
  /**
   * Removes item from localStorage with safety checks
   * @param key Storage key
   */
  export function removeLocalStorage(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing localStorage item:', error);
    }
  }
  
  /**
   * Gets item from sessionStorage with safety checks
   * @param key Storage key
   * @returns Item value or null if not found
   */
  export function getSessionStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing sessionStorage:', error);
      return null;
    }
  }
  
  /**
   * Sets item in sessionStorage with safety checks
   * @param key Storage key
   * @param value Item value
   */
  export function setSessionStorage(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting sessionStorage item:', error);
    }
  }
  
  /**
   * Removes item from sessionStorage with safety checks
   * @param key Storage key
   */
  export function removeSessionStorage(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing sessionStorage item:', error);
    }
  }
  
  /**
   * Gets an item from localStorage as JSON
   * @param key Storage key
   * @returns Parsed JSON object or null
   */
  export function getLocalStorageJson<T>(key: string): T | null {
    const value = getLocalStorage(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing JSON from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Sets an item in localStorage as JSON
   * @param key Storage key
   * @param value Object to be stored as JSON
   */
  export function setLocalStorageJson<T>(key: string, value: T): void {
    try {
      const jsonValue = JSON.stringify(value);
      setLocalStorage(key, jsonValue);
    } catch (error) {
      console.error('Error stringifying object for localStorage:', error);
    }
  }
