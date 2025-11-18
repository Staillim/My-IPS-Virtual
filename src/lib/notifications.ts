'use client';

/**
 * Sistema de notificaciones del navegador para IPS Virtual
 * Gestiona permisos, muestra notificaciones y reproduce sonidos
 */

// Tipos de notificaciones disponibles en la aplicación
export enum NotificationType {
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  RESCHEDULE_REQUEST = 'reschedule_request',
  DIAGNOSIS_READY = 'diagnosis_ready',
  FORMULA_CREATED = 'formula_created',
  NEW_MESSAGE = 'new_message',
}

// Configuración de notificaciones por tipo
const notificationConfig: Record<NotificationType, { icon: string; sound: boolean }> = {
  [NotificationType.APPOINTMENT_CONFIRMED]: {
    icon: '/icon-appointment.png',
    sound: true,
  },
  [NotificationType.APPOINTMENT_RESCHEDULED]: {
    icon: '/icon-calendar.png',
    sound: true,
  },
  [NotificationType.APPOINTMENT_CANCELLED]: {
    icon: '/icon-cancel.png',
    sound: false,
  },
  [NotificationType.RESCHEDULE_REQUEST]: {
    icon: '/icon-calendar.png',
    sound: true,
  },
  [NotificationType.DIAGNOSIS_READY]: {
    icon: '/icon-diagnosis.png',
    sound: true,
  },
  [NotificationType.FORMULA_CREATED]: {
    icon: '/icon-formula.png',
    sound: true,
  },
  [NotificationType.NEW_MESSAGE]: {
    icon: '/icon-message.png',
    sound: true,
  },
};

/**
 * Solicita permisos de notificación al usuario
 * @returns Promise con el estado del permiso
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Verifica el estado actual de los permisos de notificación
 * @returns Objeto con el estado del permiso
 */
export function checkNotificationPermission(): {
  supported: boolean;
  granted: boolean;
  denied: boolean;
  default: boolean;
} {
  const supported = 'Notification' in window;

  return {
    supported,
    granted: supported && Notification.permission === 'granted',
    denied: supported && Notification.permission === 'denied',
    default: supported && Notification.permission === 'default',
  };
}

/**
 * Muestra una notificación del navegador
 * @param title Título de la notificación
 * @param options Opciones de la notificación
 * @returns Objeto Notification o null si no se pudo mostrar
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!checkNotificationPermission().granted) {
    console.warn('No hay permisos para mostrar notificaciones');
    return null;
  }

  try {
    const notification = new Notification(title, {
      ...options,
      badge: '/logo.png',
    });

    // Auto-cerrar después de 10 segundos si no se especifica lo contrario
    if (!options?.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }

    return notification;
  } catch (error) {
    console.error('Error al mostrar notificación:', error);
    return null;
  }
}

/**
 * Muestra una notificación con configuración específica según el tipo
 * @param type Tipo de notificación
 * @param title Título
 * @param body Cuerpo del mensaje
 * @param data Datos adicionales
 * @returns Notification o null
 */
export function showAppNotification(
  type: NotificationType,
  title: string,
  body: string,
  data?: any
): Notification | null {
  const config = notificationConfig[type];

  return showBrowserNotification(title, {
    body,
    icon: config.icon,
    data: { type, ...data },
    tag: type,
    requireInteraction: type === NotificationType.RESCHEDULE_REQUEST,
  });
}

/**
 * Reproduce el sonido de notificación
 */
export function playNotificationSound(): void {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.warn('No se pudo reproducir el sonido de notificación:', error);
    });
  } catch (error) {
    console.warn('Error al intentar reproducir sonido:', error);
  }
}
