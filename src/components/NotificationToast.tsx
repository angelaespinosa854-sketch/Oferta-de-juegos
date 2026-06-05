import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Flame, Info, CheckCircle, X, Volume2, VolumeX } from 'lucide-react';
import { LiveNotification } from '../types';

import { playChimeSound, playClickSound, playTabSound } from '../utils/audio';

interface NotificationToastProps {
  notifications: LiveNotification[];
  onMarkAllRead: () => void;
  onSimulateDeal: () => void;
}

// Backwards-compatible chime trigger
export function playChime() {
  playChimeSound();
}

export default function NotificationToast({
  notifications,
  onMarkAllRead,
  onSimulateDeal,
}: NotificationToastProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentCount, setRecentCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBrowserPermPrompt, setShowBrowserPermPrompt] = useState(false);

  // Monitor newly arrived unread notifications and play chime
  useEffect(() => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length > recentCount) {
      if (soundEnabled && recentCount > 0) {
        playChime();
      }
      
      // Trigger native browser notification if allowed
      const newest = unread[0];
      if (newest && recentCount > 0 && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(newest.title, {
            body: newest.message,
            icon: '/favicon.ico',
          });
        }
      }
      setRecentCount(unread.length);
    } else {
      setRecentCount(unread.length);
    }
  }, [notifications, soundEnabled, recentCount]);

  // Request browser desktop notification permissions
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('🇦🇷 Sistema Gamer de Ofertas', {
          body: '¡Notificaciones de escritorio en tiempo real habilitadas exitosamente!',
        });
      }
      setShowBrowserPermPrompt(false);
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowBrowserPermPrompt(true);
    }
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="relative">
      {/* Browser Notification Banner Prompt */}
      {showBrowserPermPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 bg-teal-950 border border-teal-500 rounded-lg shadow-xl shadow-teal-950/50 flex flex-col gap-2 text-sm text-teal-100"
        >
          <div className="flex items-start gap-2">
            <Bell className="w-5 h-5 text-teal-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="font-semibold text-white">¿Habilitar Alertas de Escritorio?</p>
              <p className="text-teal-300 text-xs mt-0.5">Recibí avisos de descuentos argentinos al instante aun estando en otra pestaña.</p>
            </div>
            <button 
              onClick={() => {
                playClickSound();
                setShowBrowserPermPrompt(false);
              }} 
              className="ml-auto text-teal-400 hover:text-white"
              id="close-perm-banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => {
                playClickSound();
                setShowBrowserPermPrompt(false);
              }}
              className="px-3 py-1 text-xs text-teal-300 hover:text-white"
              id="deny-perm-btn"
            >
              No, gracias
            </button>
            <button
              onClick={() => {
                playClickSound();
                requestNotificationPermission();
              }}
              className="px-3 py-1 text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-teal-950 rounded"
              id="grant-perm-btn"
            >
              Activar Alertas
            </button>
          </div>
        </motion.div>
      )}

      {/* Trigger button & Indicator */}
      <div className="flex items-center gap-3">
        {/* Play alert simulator button */}
        <button
          onClick={() => {
            playClickSound();
            onSimulateDeal();
          }}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-amber-500/30 text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 transition-colors flex items-center gap-1.5"
          title="Simular un descuento aleatorio en tiempo real"
          id="simulate-deal-btn"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          Probar Alerta en Tiempo Real
        </button>

        {/* Audio control button */}
        <button
          onClick={() => {
            playClickSound();
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) playChime();
          }}
          className={`p-2 rounded-lg border transition-colors ${
            soundEnabled 
              ? 'bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-750' 
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-850'
          }`}
          title={soundEnabled ? 'Sonido de alarmas habilitado' : 'Sonido silenciado'}
          id="toggle-chime-btn"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Notification Bell Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              playClickSound();
              setShowDropdown(!showDropdown);
            }}
            className={`p-2 rounded-lg border transition-all relative ${
              showDropdown 
                ? 'bg-sky-950/50 border-sky-500 text-sky-400' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
            id="notifications-bell-btn"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Expanded notifications panel */}
          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 max-w-sm bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-sky-400" />
                      Historial de Alertas
                    </span>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={() => {
                          playClickSound();
                          onMarkAllRead();
                          playChime();
                        }}
                        className="text-[11px] font-medium text-sky-450 hover:text-sky-300"
                        id="mark-all-read-btn"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No hay alertas recientes en este momento. ¡Agregá tus juegos al radar!
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition-colors ${
                            notif.read ? 'bg-slate-900/40 text-slate-400' : 'bg-sky-950/20 text-slate-100 hover:bg-sky-950/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {!notif.read && <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />}
                            <span className="font-semibold text-white">{notif.title}</span>
                            <span className="ml-auto text-[10px] text-slate-500">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="leading-relaxed leading-snug">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-slate-950 text-center text-[10px] text-slate-500 border-t border-slate-800">
                    Las notificaciones simulan actualizaciones periódicas
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
