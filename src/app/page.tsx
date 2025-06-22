"use client";

import { useState, useEffect } from "react";
import { EntrevistaDashboard } from "@/components/entrevistas-dashboard";
import { PWAInstall } from "@/components/pwa-install";

export default function Home() {
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    // Solicitar permisos de notificación al cargar
    if ("Notification" in window) {
      Notification.requestPermission();
    }
    setShowApp(true);
  }, []);

  if (!showApp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Cargando CRM Llefia...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PWAInstall />
      <EntrevistaDashboard onBack={() => {}} userEmail="tutor@fpllefia.com" />
    </>
  );
}
