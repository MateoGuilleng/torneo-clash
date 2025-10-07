// Utilidades para la API de Clash Royale
export const CLASH_ROYALE_API = {
  BASE_URL: 'https://api.clashroyale.com/v1',
  ENDPOINTS: {
    PLAYER: '/players',
    CLAN: '/clans',
    CARDS: '/cards',
    TOURNAMENTS: '/tournaments'
  },
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 1000,
    REQUESTS_PER_DAY: 100000
  }
};

// Función para limpiar y formatear el player tag
export function formatPlayerTag(tag) {
  if (!tag) return null;
  
  // Remover espacios y convertir a mayúsculas
  const cleanTag = tag.trim().toUpperCase();
  
  // Agregar # si no existe
  return cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`;
}

// Función para validar el formato del player tag
export function isValidPlayerTag(tag) {
  if (!tag) return false;
  
  const formattedTag = formatPlayerTag(tag);
  
  // El tag debe tener el formato #XXXXXXXXX (8-9 caracteres después del #)
  const tagRegex = /^#[A-Z0-9]{8,9}$/;
  
  return tagRegex.test(formattedTag);
}

// Función para manejar errores de la API
export function handleAPIError(error, response) {
  const errorMessages = {
    400: 'Solicitud inválida - Verifica el formato del Player Tag',
    401: 'No autorizado - Token de API inválido',
    403: 'Acceso denegado - Token sin permisos',
    404: 'Jugador no encontrado - Verifica el Player Tag',
    429: 'Demasiadas solicitudes - Espera un momento',
    500: 'Error interno del servidor de Clash Royale',
    503: 'Servicio no disponible - Intenta más tarde'
  };

  return {
    status: response?.status || 500,
    message: errorMessages[response?.status] || 'Error desconocido',
    originalError: error.message
  };
}

// Función para formatear estadísticas del jugador
export function formatPlayerStats(playerData) {
  if (!playerData) return null;

  return {
    basic: {
      name: playerData.name,
      tag: playerData.tag,
      level: playerData.expLevel,
      trophies: playerData.trophies,
      bestTrophies: playerData.bestTrophies
    },
    battles: {
      total: playerData.battleCount,
      wins: playerData.wins,
      losses: playerData.losses,
      threeCrowns: playerData.threeCrownWins,
      winRate: playerData.battleCount > 0 ? ((playerData.wins / playerData.battleCount) * 100).toFixed(1) : 0
    },
    challenges: {
      cardsWon: playerData.challengeCardsWon,
      maxWins: playerData.challengeMaxWins
    },
    clan: playerData.clan ? {
      name: playerData.clan.name,
      tag: playerData.clan.tag,
      role: playerData.role
    } : null,
    arena: {
      id: playerData.arena.id,
      name: playerData.arena.name
    },
    league: playerData.leagueStatistics ? {
      current: playerData.leagueStatistics.currentSeason,
      previous: playerData.leagueStatistics.previousSeason,
      best: playerData.leagueStatistics.bestSeason
    } : null,
    badges: playerData.badges || []
  };
}
