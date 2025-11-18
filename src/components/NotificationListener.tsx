'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { 
  showAppNotification, 
  NotificationType, 
  checkNotificationPermission,
  playNotificationSound 
} from '@/lib/notifications';

export function NotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Query para obtener notificaciones no leídas del usuario
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      limit(10)
    );
  }, [firestore, user]);

  const { data: notifications } = useCollection(notificationsQuery);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Verificar permisos de notificaciones
    const permission = checkNotificationPermission();
    if (!permission.granted) return;

    // Procesar cada notificación no leída
    notifications.forEach((notification) => {
      // Verificar si ya fue mostrada en esta sesión
      const shownKey = `notification-shown-${notification.id}`;
      if (sessionStorage.getItem(shownKey)) return;

      // Mostrar notificación según el tipo
      let notificationType: NotificationType;
      
      switch (notification.type) {
        case 'appointment_confirmed':
          notificationType = NotificationType.APPOINTMENT_CONFIRMED;
          break;
        case 'appointment_rescheduled':
          notificationType = NotificationType.APPOINTMENT_RESCHEDULED;
          break;
        case 'appointment_cancelled':
          notificationType = NotificationType.APPOINTMENT_CANCELLED;
          break;
        case 'reschedule_request':
          notificationType = NotificationType.RESCHEDULE_REQUEST;
          break;
        case 'diagnosis_ready':
          notificationType = NotificationType.DIAGNOSIS_READY;
          break;
        case 'formula_created':
          notificationType = NotificationType.FORMULA_CREATED;
          break;
        default:
          notificationType = NotificationType.NEW_MESSAGE;
      }

      // Mostrar la notificación
      const browserNotification = showAppNotification(
        notificationType,
        notification.title,
        notification.message,
        { notificationId: notification.id, relatedId: notification.relatedId }
      );

      if (browserNotification) {
        // Reproducir sonido
        playNotificationSound();

        // Manejar clic en la notificación
        browserNotification.onclick = () => {
          window.focus();
          
          // Navegar según el tipo de notificación
          if (notification.relatedId) {
            if (notification.type.includes('appointment')) {
              window.location.href = '/dashboard/citas';
            } else if (notification.type.includes('diagnosis')) {
              window.location.href = '/dashboard/historial';
            } else if (notification.type.includes('formula')) {
              window.location.href = '/dashboard/formulas';
            }
          }

          // Marcar como leída
          if (firestore) {
            const notifRef = doc(firestore, 'notifications', notification.id);
            updateDocumentNonBlocking(notifRef, { read: true });
          }

          browserNotification.close();
        };

        // Marcar como mostrada en esta sesión
        sessionStorage.setItem(shownKey, 'true');
      }
    });
  }, [notifications, firestore]);

  return null; // Este componente no renderiza nada
}
