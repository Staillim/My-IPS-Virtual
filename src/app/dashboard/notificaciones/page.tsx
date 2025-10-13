'use client';

import { Header } from '@/components/header';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCircle, Calendar, FileText, Stethoscope, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function NotificacionesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Query all notifications for the user
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  // Sort notifications: unread first, then by date
  const sortedNotifications = notifications ? [...notifications].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.createdAt?.seconds - a.createdAt?.seconds;
  }) : [];

  const unreadCount = sortedNotifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    if (!firestore) return;
    
    setUpdatingIds(prev => new Set(prev).add(notificationId));
    
    try {
      const notificationDocRef = doc(firestore, 'notifications', notificationId);
      await updateDocumentNonBlocking(notificationDocRef, { read: true });
      
      toast({
        title: "Marcado como leído",
        description: "La notificación ha sido marcada como leída.",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar como leída.",
        variant: "destructive",
      });
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!firestore) return;
    
    const unreadNotifications = sortedNotifications.filter(n => !n.read);
    
    try {
      await Promise.all(
        unreadNotifications.map(notification => {
          const notificationDocRef = doc(firestore, 'notifications', notification.id);
          return updateDocumentNonBlocking(notificationDocRef, { read: true });
        })
      );
      
      toast({
        title: "Todas marcadas como leídas",
        description: `${unreadNotifications.length} notificaciones marcadas.`,
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "No se pudieron marcar todas como leídas.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!firestore) return;
    
    setUpdatingIds(prev => new Set(prev).add(notificationId));
    
    try {
      const notificationDocRef = doc(firestore, 'notifications', notificationId);
      await deleteDocumentNonBlocking(notificationDocRef);
      
      toast({
        title: "Notificación eliminada",
        description: "La notificación ha sido eliminada.",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación.",
        variant: "destructive",
      });
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_confirmed':
      case 'appointment_cancelled':
        return <Calendar className="h-5 w-5" />;
      case 'diagnosis_ready':
        return <Stethoscope className="h-5 w-5" />;
      case 'formula_created':
        return <FileText className="h-5 w-5" />;
      case 'note_added':
        return <FileText className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment_confirmed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'appointment_cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'diagnosis_ready':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'formula_created':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'note_added':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notificaciones
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer` : 'No tienes notificaciones sin leer'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes notificaciones</h3>
              <p className="text-muted-foreground text-center">
                Cuando recibas notificaciones sobre tus citas, diagnósticos o fórmulas, aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => {
              const isUpdating = updatingIds.has(notification.id);
              
              return (
                <Card 
                  key={notification.id} 
                  className={`transition-all ${
                    !notification.read 
                      ? 'border-l-4 border-l-primary shadow-md' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                          {!notification.read && (
                            <Badge variant="default" className="shrink-0">Nueva</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {notification.createdAt && format(
                              new Date(notification.createdAt.seconds * 1000),
                              "d 'de' MMMM 'a las' h:mm a",
                              { locale: es }
                            )}
                          </span>
                          
                          <div className="flex gap-2">
                            {!notification.read && (
                              <Button
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={isUpdating}
                                variant="ghost"
                                size="sm"
                                className="h-8"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marcar como leída
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDelete(notification.id)}
                              disabled={isUpdating}
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
