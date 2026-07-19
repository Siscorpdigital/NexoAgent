"use client";

import { useState, useEffect } from "react";

interface NotificationToggleProps {
  empresaId: string;
}

export default function NotificationToggle({ empresaId }: NotificationToggleProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    if ("Notification" in window && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error verificando suscripción:", error);
    }
  }

  async function subscribeToNotifications() {
    setLoading(true);
    try {
      // Solicitar permiso
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        alert("Necesitas otorgar permisos para recibir notificaciones");
        setLoading(false);
        return;
      }

      // Registrar service worker si no está registrado
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        await navigator.serviceWorker.ready;
      }

      // Suscribirse a push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Enviar suscripción al servidor
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          empresaId,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar suscripción");
      }

      setIsSubscribed(true);
      alert("✅ Notificaciones activadas correctamente");
    } catch (error) {
      console.error("Error al suscribirse:", error);
      alert("Error al activar notificaciones. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribeFromNotifications() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Desuscribir del navegador
        await subscription.unsubscribe();

        // Eliminar del servidor
        await fetch(
          `/api/push/subscribe?empresaId=${empresaId}&endpoint=${encodeURIComponent(
            subscription.endpoint
          )}`,
          {
            method: "DELETE",
          }
        );
      }

      setIsSubscribed(false);
      alert("✅ Notificaciones desactivadas");
    } catch (error) {
      console.error("Error al desuscribirse:", error);
      alert("Error al desactivar notificaciones");
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) {
    return null; // No mostrar si el navegador no soporta notificaciones
  }

  return (
    <div className="flex items-center gap-2">
      {isSubscribed ? (
        <button
          onClick={unsubscribeFromNotifications}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: "#F4F7F6",
            color: "#3D6E65",
          }}
          title="Desactivar notificaciones"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6zM7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.43 1.43c2.02 1.45 3.39 3.77 3.55 6.42z"/>
          </svg>
          {loading ? "..." : "Notificaciones activadas"}
        </button>
      ) : (
        <button
          onClick={subscribeToNotifications}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #2BAA8A 0%, #2BAA8A 100%)",
            color: "white",
          }}
          title="Activar notificaciones"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          {loading ? "Activando..." : "Activar notificaciones"}
        </button>
      )}
    </div>
  );
}

// Helper para convertir VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
