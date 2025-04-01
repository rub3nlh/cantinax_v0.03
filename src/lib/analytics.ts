// analytics.ts - Sistema centralizado de tracking para CantinaX
import { User } from '@supabase/supabase-js';

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
  enabled: process.env.NODE_ENV === 'production', // Por defecto solo activo en producción
};

/**
 * Inicializa los servicios de analytics
 */
export const initAnalytics = (options: Partial<AnalyticsConfig> = {}) => {
  config = { ...config, ...options };

  // Inicializar Google Analytics (GA4)
  if (config.googleAnalyticsId) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', config.googleAnalyticsId);
  }

  // Inicializar Amplitude
  if (config.amplitudeApiKey) {
    (function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script");
    r.type="text/javascript";
    r.integrity="sha384-girahbTbYZ9tT03PWWj0mEVgyxtZoyDF9KVZdL+R53PP5wCY0PiVUKq0jeRlZ8Q2";
    r.crossOrigin="anonymous";r.async=true;
    r.src="https://cdn.amplitude.com/libs/amplitude-8.21.4-min.gz.js";
    r.onload=function(){if(!e.amplitude.runQueuedFunctions){console.log("[Amplitude] Error: could not load SDK")}};
    var s=t.getElementsByTagName("script")[0];s.parentNode.insertBefore(r,s);
    function i(){this._q=[];return this}function o(e){
    this._q.push([e]);return this}var a=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove"];
    for(var c=0;c<a.length;c++){i.prototype[a[c]]=o(a[c])}n.Identify=i;function u(e){this._q=[];
    return this}function l(e){this._q.push([e]);return this}var p=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"];
    for(var d=0;d<p.length;d++){u.prototype[p[d]]=l(p[d])}n.Revenue=u;
    var v=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","enableTracking","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId","getDeviceId","getUserId","setMinTimeBetweenSessionsMillis","setEventUploadThreshold","setUseDynamicConfig","setServerZone","setServerUrl","sendEvents","setLibrary","setTransport"];
    function f(e){function t(t){e[t]=function(){e._q.push([t].concat(Array.prototype.slice.call(arguments,0)))}}
    for(var n=0;n<v.length;n++){t(v[n])}}f(n);n._q=[];e.amplitude=n})(window,document);
    
    window.amplitude.init(config.amplitudeApiKey);
  }
};

// Funciones para identificar usuarios
export const identifyUser = (user: User | null) => {
  if (!config.enabled || !user) return;

  if (config.googleAnalyticsId) {
    window.gtag('set', { user_id: user.id });
  }

  if (config.amplitudeApiKey) {
    window.amplitude.setUserId(user.id);
    
    // Configurar propiedades de usuario en Amplitude
    const identify = new window.amplitude.Identify();
    
    if (user.email) {
      identify.set('email', user.email);
    }
    
    if (user.user_metadata) {
      if (user.user_metadata.display_name) {
        identify.set('name', user.user_metadata.display_name);
      }
      if (user.user_metadata.province) {
        identify.set('province', user.user_metadata.province);
      }
    }
    
    window.amplitude.identify(identify);
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
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics] Event: ${eventName}`, data);
  }

  // Google Analytics (GA4)
  if (config.googleAnalyticsId) {
    window.gtag('event', eventName, data);
  }

  // Amplitude
  if (config.amplitudeApiKey) {
    window.amplitude.logEvent(eventName, data);
  }
};

// Tipos de eventos predefinidos para garantizar consistencia
export const EventTypes = {
  // Eventos de navegación
  PAGE_VIEW: 'page_view',
  
  // Eventos de funnel de compra
  PACKAGE_VIEW: 'package_view',
  PACKAGE_SELECT: 'package_select',
  MEAL_VIEW: 'meal_view',
  MEAL_DETAILS_VIEW: 'meal_details_view',
  MEAL_ADDED: 'meal_added',
  MEAL_REMOVED: 'meal_removed',
  MEALS_SELECTED: 'meals_selected',
  CHECKOUT_START: 'checkout_start',
  ADDRESS_ADDED: 'address_added',
  ADDRESS_SELECTED: 'address_selected',
  DISCOUNT_CODE_APPLIED: 'discount_code_applied',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PURCHASE_COMPLETED: 'purchase_completed',
  
  // Eventos de usuario
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Eventos de interacción
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  FILTER_APPLIED: 'filter_applied',
  
  // Eventos de errores
  ERROR_OCCURRED: 'error_occurred',
  PAYMENT_ERROR: 'payment_error',
  VALIDATION_ERROR: 'validation_error',
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