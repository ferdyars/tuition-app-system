// Payment timing configuration
// Frontend shows shorter time to create urgency
// Backend has buffer for email/IMAP delays

const BACKEND_EXPIRY_MINUTES = 10;
const FRONTEND_EXPIRY_MINUTES = 5;

export interface PaymentTiming {
  backendExpiresAt: Date;
  frontendExpiresAt: Date;
  displayMinutes: number;
}

/**
 * Calculate payment timing with dual timers
 * - Frontend: 5 minutes (creates urgency, shown to user)
 * - Backend: 10 minutes (actual expiration, buffer for email delays)
 */
export function calculatePaymentTiming(): PaymentTiming {
  const now = new Date();

  const backendExpiresAt = new Date(
    now.getTime() + BACKEND_EXPIRY_MINUTES * 60 * 1000,
  );

  const frontendExpiresAt = new Date(
    now.getTime() + FRONTEND_EXPIRY_MINUTES * 60 * 1000,
  );

  return {
    backendExpiresAt,
    frontendExpiresAt,
    displayMinutes: FRONTEND_EXPIRY_MINUTES,
  };
}

/**
 * Get frontend expiry from backend expiry
 * Frontend expiry = backend expiry - 5 minutes
 */
export function getFrontendExpiryFromBackend(backendExpiresAt: Date): Date {
  return new Date(
    backendExpiresAt.getTime() -
      (BACKEND_EXPIRY_MINUTES - FRONTEND_EXPIRY_MINUTES) * 60 * 1000,
  );
}

/**
 * Check if payment request is expired (backend)
 */
export function isPaymentExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Check if payment request is expired for frontend display
 */
export function isFrontendExpired(backendExpiresAt: Date): boolean {
  const frontendExpiresAt = getFrontendExpiryFromBackend(backendExpiresAt);
  return new Date() > frontendExpiresAt;
}

export const PAYMENT_TIMING_CONFIG = {
  backendExpiryMinutes: BACKEND_EXPIRY_MINUTES,
  frontendExpiryMinutes: FRONTEND_EXPIRY_MINUTES,
};
