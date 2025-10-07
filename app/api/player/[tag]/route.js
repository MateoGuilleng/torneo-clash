import { NextResponse } from 'next/server';
import { formatPlayerTag, isValidPlayerTag, handleAPIError, formatPlayerStats } from '../../../../lib/clashroyale-utils.js';

export async function GET(request, { params }) {
  try {
    const { tag } = params;
    const token = process.env.CLASH_ROYALE_TOKEN;

    // Validaciones básicas
    if (!tag) {
      return NextResponse.json({ 
        error: 'Missing player tag',
        message: 'Falta el Player Tag'
      }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ 
        error: 'Clash Royale API token not configured',
        message: 'Token de API no configurado. Verifica tu archivo .env.local'
      }, { status: 500 });
    }

    // Formatear y validar el tag
    const formattedTag = formatPlayerTag(tag);
    
    if (!isValidPlayerTag(formattedTag)) {
      return NextResponse.json({ 
        error: 'Invalid player tag format',
        message: 'Formato de Player Tag inválido. Debe ser como #G9YV9GR8R'
      }, { status: 400 });
    }

    const encodedTag = encodeURIComponent(formattedTag);
    console.log(`Fetching player data for tag: ${formattedTag}`);

    // Llamada a la API de Clash Royale
    const response = await fetch(`https://api.clashroyale.com/v1/players/${encodedTag}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = handleAPIError(new Error('API request failed'), response);
      
      console.error('Clash Royale API Error:', {
        status: response.status,
        message: error.message,
        tag: formattedTag,
        apiResponse: errorData
      });

      return NextResponse.json({ 
        error: error.message,
        status: error.status,
        details: errorData.reason || errorData.message
      }, { status: error.status });
    }

    const playerData = await response.json();
    
    // Formatear los datos del jugador para mejor uso en el frontend
    const formattedData = formatPlayerStats(playerData);
    
    console.log(`Successfully fetched data for player: ${playerData.name} (${playerData.tag})`);

    return NextResponse.json(formattedData, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
        'X-Player-Tag': formattedTag,
        'X-Player-Name': playerData.name
      }
    });

  } catch (error) {
    console.error('Error fetching player data:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
