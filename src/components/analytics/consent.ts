export const CONSENT_KEY = "pd-consent";
export const CONSENT_EVENT = "pd-consent-change";

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl)
      && navigator.doNotTrack !== "1" && localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch { return false; }
}
