// Environment configuration with fallbacks for production
export const ENV_CONFIG = {
  // Firebase Admin - required for chat functionality
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  
  // Google AI API Key - required for chat functionality  
  GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
  
  // Optional environment variables
  GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY,
  GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ENGINE_ID,
  SERPAPI_KEY: process.env.SERPAPI_KEY,
  
  // Admin email
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
} as const;

// Check if required environment variables are present
export function validateEnvironment() {
  const missing = [];
  
  if (!ENV_CONFIG.FIREBASE_SERVICE_ACCOUNT_KEY) {
    missing.push('FIREBASE_SERVICE_ACCOUNT_KEY');
  }
  
  if (!ENV_CONFIG.GOOGLE_GENAI_API_KEY) {
    missing.push('GOOGLE_GENAI_API_KEY');
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    hasOptional: {
      search: !!(ENV_CONFIG.GOOGLE_SEARCH_API_KEY || ENV_CONFIG.SERPAPI_KEY),
      admin: !!ENV_CONFIG.SUPER_ADMIN_EMAIL
    }
  };
}

// Get a safe environment status for client-side display
export function getEnvironmentStatus() {
  const validation = validateEnvironment();
  
  return {
    chatEnabled: validation.isValid,
    searchEnabled: validation.hasOptional.search,
    adminConfigured: validation.hasOptional.admin,
    missingServices: validation.missing.length > 0 ? validation.missing.length : 0
  };
}
