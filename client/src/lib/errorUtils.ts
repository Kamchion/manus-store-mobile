/**
 * Limpia mensajes de error para mostrar solo información relevante al usuario
 * Elimina URLs, stack traces y otra información técnica innecesaria
 */
export function cleanErrorMessage(error: any): string {
  if (!error) return "Ha ocurrido un error";

  let message = "";

  // Si el error tiene una propiedad message, usarla
  if (typeof error === "string") {
    message = error;
  } else if (error.message) {
    message = error.message;
  } else if (error.error) {
    message = error.error;
  } else {
    message = "Ha ocurrido un error";
  }

  // Eliminar URLs (http://, https://, www., etc.)
  message = message.replace(/https?:\/\/[^\s]+/gi, "");
  message = message.replace(/www\.[^\s]+/gi, "");

  // Eliminar rutas de archivos (paths que contienen / o \)
  message = message.replace(/[a-zA-Z]:[\\\/][^\s]+/g, "");
  message = message.replace(/\/[a-zA-Z0-9_\-\/]+\.[a-zA-Z]{2,4}/g, "");

  // Eliminar referencias a líneas de código (at line X, line:X, etc.)
  message = message.replace(/at line \d+/gi, "");
  message = message.replace(/line:\s*\d+/gi, "");
  message = message.replace(/:\d+:\d+/g, "");

  // Eliminar stack traces (líneas que empiezan con "at ")
  message = message.split("\n")[0]; // Solo tomar la primera línea

  // Eliminar información de status HTTP innecesaria
  message = message.replace(/\(?\d{3}\s+[A-Za-z\s]+\)?/g, "");

  // Eliminar caracteres especiales repetidos y espacios múltiples
  message = message.replace(/\s+/g, " ");
  message = message.replace(/[:\-–—]\s*$/g, "");

  // Trim y capitalizar primera letra
  message = message.trim();
  if (message.length > 0) {
    message = message.charAt(0).toUpperCase() + message.slice(1);
  }

  // Si el mensaje quedó vacío o muy corto, usar mensaje genérico
  if (message.length < 3) {
    message = "Ha ocurrido un error";
  }

  // Limitar longitud máxima
  if (message.length > 150) {
    message = message.substring(0, 147) + "...";
  }

  return message;
}

/**
 * Extrae el mensaje de error de diferentes tipos de objetos de error
 */
export function getErrorMessage(error: any): string {
  return cleanErrorMessage(error);
}

