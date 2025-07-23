/**
 * Utility functions for client-side operations
 * These help prevent SSR issues by checking if we're on the client side
 */

/**
 * Check if the code is running on the client side (browser)
 */
export const isClient = typeof window !== 'undefined';

/**
 * Safely access localStorage
 * @param key - The localStorage key
 * @param defaultValue - Default value if key doesn't exist or on server
 */
export const getLocalStorage = (key: string, defaultValue: string | null = null): string | null => {
  if (!isClient) return defaultValue;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return defaultValue;
  }
};

/**
 * Safely set localStorage
 * @param key - The localStorage key
 * @param value - The value to store
 */
export const setLocalStorage = (key: string, value: string): void => {
  if (!isClient) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
};

/**
 * Safely remove localStorage item
 * @param key - The localStorage key
 */
export const removeLocalStorage = (key: string): void => {
  if (!isClient) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing localStorage:', error);
  }
};

/**
 * Safely set document attribute
 * @param attribute - The attribute name
 * @param value - The attribute value
 */
export const setDocumentAttribute = (attribute: string, value: string): void => {
  if (!isClient) return;
  try {
    document.documentElement.setAttribute(attribute, value);
  } catch (error) {
    console.error('Error setting document attribute:', error);
  }
};

/**
 * Safely add event listener
 * @param element - The element to add listener to
 * @param event - The event type
 * @param handler - The event handler
 * @param options - Event listener options
 */
export const addEventListener = <K extends keyof HTMLElementEventMap>(
  element: EventTarget,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void => {
  if (!isClient) return;
  try {
    element.addEventListener(event, handler as EventListener, options);
  } catch (error) {
    console.error('Error adding event listener:', error);
  }
};

/**
 * Safely add event listener (generic version for custom event types)
 * @param element - The element to add listener to
 * @param event - The event type
 * @param handler - The event handler
 * @param options - Event listener options
 */
export const addEventListenerGeneric = (
  element: EventTarget,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void => {
  if (!isClient) return;
  try {
    element.addEventListener(event, handler, options);
  } catch (error) {
    console.error('Error adding event listener:', error);
  }
};

/**
 * Safely remove event listener
 * @param element - The element to remove listener from
 * @param event - The event type
 * @param handler - The event handler
 * @param options - Event listener options
 */
export const removeEventListener = <K extends keyof HTMLElementEventMap>(
  element: EventTarget,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | EventListenerOptions
): void => {
  if (!isClient) return;
  try {
    element.removeEventListener(event, handler as EventListener, options);
  } catch (error) {
    console.error('Error removing event listener:', error);
  }
};

/**
 * Safely remove event listener (generic version for custom event types)
 * @param element - The element to remove listener from
 * @param event - The event type
 * @param handler - The event handler
 * @param options - Event listener options
 */
export const removeEventListenerGeneric = (
  element: EventTarget,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
): void => {
  if (!isClient) return;
  try {
    element.removeEventListener(event, handler, options);
  } catch (error) {
    console.error('Error removing event listener:', error);
  }
}; 