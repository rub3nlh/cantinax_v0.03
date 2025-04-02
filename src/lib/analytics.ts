// analytics.ts - Sistema centralizado de tracking para CantinaX
import { User } from "@supabase/supabase-js";

// Tipos para la configuración de analytics
interface AnalyticsConfig {
  googleAnalyticsId?: string;
  amplitudeApiKey?: string;
  enabled: boolean;
}

// Interfaz para eventos
export interface EventData {
  [key: string]: any;
}

// Configuración global
let config: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === "production", // Por defecto solo activo en producción
};

// Safe function to check if a feature is available
const safeCall = (fn: Function, ...args: any[]) => {
  try {
    return fn(...args);
  } catch (error) {
    console.error("[Analytics] Error calling function:", error);
    return null;
  }
};

/**
 * Inicializa los servicios de analytics
 */
export const initAnalytics = (options: Partial<AnalyticsConfig> = {}) => {
  config = { ...config, ...options };

  // Inicializar Google Analytics (GA4)
  if (config.googleAnalyticsId) {
    try {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", config.googleAnalyticsId);
    } catch (error) {
      console.error("[Analytics] Error initializing Google Analytics:", error);
    }
  }

  // Inicializar Amplitude
  if (config.amplitudeApiKey) {
    try {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://cdn.amplitude.com/libs/amplitude-8.21.4-min.gz.js";

      script.onload = function () {
        try {
          if (window.amplitude) {
            window.amplitude.init(config.amplitudeApiKey);
          } else {
            console.error("[Amplitude] Error: window.amplitude is not defined");
          }
        } catch (error) {
          console.error("[Amplitude] Error initializing:", error);
        }
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error("[Analytics] Error loading Amplitude script:", error);
    }
  }
};

// Funciones para identificar usuarios
export const identifyUser = (user: User | null) => {
  if (!config.enabled || !user) return;

  // Google Analytics
  if (config.googleAnalyticsId && window.gtag) {
    safeCall(() => window.gtag("set", { user_id: user.id }));
  }

  // Amplitude
  if (config.amplitudeApiKey && window.amplitude) {
    try {
      safeCall(() => window.amplitude.setUserId(user.id));

      // Solo intentar identificar si la función está disponible
      if (window.amplitude.Identify) {
        const identify = new window.amplitude.Identify();

        if (user.email) {
          identify.set("email", user.email);
        }

        if (user.user_metadata) {
          if (user.user_metadata.display_name) {
            identify.set("name", user.user_metadata.display_name);
          }
          if (user.user_metadata.province) {
            identify.set("province", user.user_metadata.province);
          }
        }

        window.amplitude.identify(identify);
      }
    } catch (error) {
      console.error("[Analytics] Error identifying user in Amplitude:", error);
    }
  }
};

/**
 * Registra un evento en todos los proveedores de analytics configurados
 * @param eventName Nombre del evento
 * @param data Datos adicionales del evento
 */
export const trackEvent = (eventName: string, data: EventData = {}) => {
  if (!config.enabled) return;

  // Registrar en la consola en desarrollo
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Analytics] Event: ${eventName}`, data);
  }

  // Google Analytics (GA4)
  if (config.googleAnalyticsId && window.gtag) {
    safeCall(() => window.gtag("event", eventName, data));
  }

  // Amplitude
  if (config.amplitudeApiKey && window.amplitude && window.amplitude.logEvent) {
    safeCall(() => window.amplitude.logEvent(eventName, data));
  }
};

// Tipos de eventos predefinidos para garantizar consistencia
export const EventTypes = {
  // Eventos de navegación
  PAGE_VIEW: "page_view",

  // Eventos de funnel de compra
  PACKAGE_VIEW: "package_view",
  PACKAGE_SELECT: "package_select",
  MEAL_VIEW: "meal_view",
  MEAL_DETAILS_VIEW: "meal_details_view",
  MEAL_ADDED: "meal_added",
  MEAL_REMOVED: "meal_removed",
  MEALS_SELECTED: "meals_selected",
  CHECKOUT_START: "checkout_start",
  ADDRESS_ADDED: "address_added",
  ADDRESS_SELECTED: "address_selected",
  DISCOUNT_CODE_APPLIED: "discount_code_applied",
  PAYMENT_INITIATED: "payment_initiated",
  PAYMENT_REDIRECT: "payment_redirect",
  PAYMENT_COMPLETED: "payment_completed",
  PURCHASE_COMPLETED: "purchase_completed",

  // Eventos de usuario
  USER_SIGNUP: "user_signup",
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",

  // Eventos de interacción
  BUTTON_CLICK: "button_click",
  FORM_SUBMIT: "form_submit",
  FILTER_APPLIED: "filter_applied",

  // Eventos de errores
  ERROR_OCCURRED: "error_occurred",
  PAYMENT_ERROR: "payment_error",
  VALIDATION_ERROR: "validation_error",
};

// Añadimos interfaces para definiciones globales
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    amplitude: any;
  }
}

export default {
  initAnalytics,
  trackEvent,
  identifyUser,
  EventTypes,
};
