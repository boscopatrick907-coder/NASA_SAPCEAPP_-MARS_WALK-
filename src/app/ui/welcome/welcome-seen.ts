export const WELCOME_SEEN_KEY = 'marswalk:welcome-seen:v1';

/** True once the welcome was dismissed or the demo started on this device. */
export function welcomeSeen(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
