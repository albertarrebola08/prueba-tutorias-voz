// ✅ VERSIÓN CORREGIDA SIN VIBRATE
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Este navegador no soporta notificaciones");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = (
  title: string,
  options?: NotificationOptions
) => {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      ...options,
    });

    // ✅ VIBRAR USANDO NAVIGATOR.VIBRATE (SI ESTÁ DISPONIBLE)
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    return notification;
  }
};

export const scheduleEntrevistaReminder = (
  alumnoNombre: string,
  fecha: Date
) => {
  const now = new Date();
  const timeUntilReminder = fecha.getTime() - now.getTime() - 15 * 60 * 1000; // 15 minutos antes

  if (timeUntilReminder > 0) {
    setTimeout(() => {
      sendNotification(`Entrevista programada`, {
        body: `Entrevista con ${alumnoNombre} en 15 minutos`,
        tag: "entrevista-reminder",
      });
    }, timeUntilReminder);
  }
};
