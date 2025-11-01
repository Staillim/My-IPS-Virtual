'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission, checkNotificationPermission, showBrowserNotification } from '@/lib/notifications';

export function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const permission = checkNotificationPermission();
    const dismissed = localStorage.getItem('notification-permission-dismissed');
    
    // Mostrar banner si: soporta notificaciones, no están granted, y no fue descartado
    setShow(permission.supported && !permission.granted && !dismissed);
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const result = await requestNotificationPermission();
    
    if (result === 'granted') {
      // Mostrar notificación de prueba
      showBrowserNotification(
        '¡Notificaciones Activadas!',
        {
          body: 'Ahora recibirás notificaciones sobre tus citas y diagnósticos.',
          icon: '/logo.png',
        }
      );
      setShow(false);
    } else if (result === 'denied') {
      alert('Has bloqueado las notificaciones. Para habilitarlas, ve a la configuración de tu navegador.');
    }
    
    setIsRequesting(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-permission-dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Habilitar Notificaciones</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Recibe alertas importantes sobre tu atención médica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500">📅</span>
              Confirmación de citas
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">⏰</span>
              Cambios de horario
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-500">📋</span>
              Diagnósticos disponibles
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-500">💊</span>
              Fórmulas médicas
            </li>
          </ul>
          <Button 
            onClick={handleRequestPermission} 
            className="w-full"
            disabled={isRequesting}
          >
            {isRequesting ? 'Solicitando...' : 'Activar Notificaciones'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
