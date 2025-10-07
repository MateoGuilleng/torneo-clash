// Utilidades para el manejo de errores de la API en el frontend
export const API_ERRORS = {
  NETWORK_ERROR: 'Error de conexión',
  PLAYER_NOT_FOUND: 'Jugador no encontrado',
  INVALID_TAG: 'Player Tag inválido',
  API_LIMIT_EXCEEDED: 'Límite de API excedido',
  SERVER_ERROR: 'Error del servidor',
  UNKNOWN_ERROR: 'Error desconocido'
};

// Función para manejar errores de la API en el frontend
export function handleAPIError(error, response) {
  if (!response) {
    return {
      type: 'NETWORK_ERROR',
      message: API_ERRORS.NETWORK_ERROR,
      details: 'No se pudo conectar con el servidor'
    };
  }

  switch (response.status) {
    case 400:
      return {
        type: 'INVALID_TAG',
        message: API_ERRORS.INVALID_TAG,
        details: 'Verifica que el Player Tag tenga el formato correcto (#G9YV9GR8R)'
      };
    
    case 404:
      return {
        type: 'PLAYER_NOT_FOUND',
        message: API_ERRORS.PLAYER_NOT_FOUND,
        details: 'No se encontró un jugador con ese Player Tag'
      };
    
    case 429:
      return {
        type: 'API_LIMIT_EXCEEDED',
        message: API_ERRORS.API_LIMIT_EXCEEDED,
        details: 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo'
      };
    
    case 500:
      return {
        type: 'SERVER_ERROR',
        message: API_ERRORS.SERVER_ERROR,
        details: 'Error interno del servidor. Intenta más tarde'
      };
    
    default:
      return {
        type: 'UNKNOWN_ERROR',
        message: API_ERRORS.UNKNOWN_ERROR,
        details: error.message || 'Error desconocido'
      };
  }
}

// Función para mostrar notificaciones de error
export function showErrorNotification(error, toast) {
  if (toast) {
    toast.error(error.message, {
      description: error.details,
      duration: 5000,
    });
  } else {
    // Fallback para cuando no hay sistema de toast
    alert(`${error.message}\n\n${error.details}`);
  }
}

// Función para validar Player Tag en el frontend
export function validatePlayerTag(tag) {
  if (!tag || typeof tag !== 'string') {
    return { valid: false, message: 'Player Tag es requerido' };
  }

  const cleanTag = tag.trim().toUpperCase();
  
  if (!cleanTag.startsWith('#')) {
    return { valid: false, message: 'Player Tag debe comenzar con #' };
  }

  if (cleanTag.length < 9 || cleanTag.length > 10) {
    return { valid: false, message: 'Player Tag debe tener 8-9 caracteres después del #' };
  }

  const tagRegex = /^#[A-Z0-9]{8,9}$/;
  if (!tagRegex.test(cleanTag)) {
    return { valid: false, message: 'Player Tag contiene caracteres inválidos' };
  }

  return { valid: true, message: 'Player Tag válido' };
}

// Función para formatear Player Tag en el frontend
export function formatPlayerTagFrontend(tag) {
  if (!tag) return '';
  
  const cleanTag = tag.trim().toUpperCase();
  return cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`;
}

// Constantes para la UI
export const UI_CONSTANTS = {
  LOADING_MESSAGES: [
    'Cargando datos del jugador...',
    'Obteniendo información de Clash Royale...',
    'Conectando con la API...',
    'Procesando datos...'
  ],
  
  ERROR_ICONS: {
    NETWORK_ERROR: '🌐',
    PLAYER_NOT_FOUND: '❌',
    INVALID_TAG: '⚠️',
    API_LIMIT_EXCEEDED: '⏰',
    SERVER_ERROR: '🔧',
    UNKNOWN_ERROR: '❓'
  },
  
  SUCCESS_MESSAGES: {
    PLAYER_LOADED: 'Datos del jugador cargados correctamente',
    TOURNAMENT_STARTED: 'Torneo iniciado exitosamente',
    MATCH_COMPLETED: 'Match completado'
  }
};

// Función para obtener un mensaje de carga aleatorio
export function getRandomLoadingMessage() {
  const messages = UI_CONSTANTS.LOADING_MESSAGES;
  return messages[Math.floor(Math.random() * messages.length)];
}

// Función para obtener el icono de error
export function getErrorIcon(errorType) {
  return UI_CONSTANTS.ERROR_ICONS[errorType] || UI_CONSTANTS.ERROR_ICONS.UNKNOWN_ERROR;
}
