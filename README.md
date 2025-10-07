# 🏆 Torneo Clash Royale - Documentación Completa

## 📋 Resumen del Proyecto

Sistema completo de torneo de Clash Royale con integración a la API oficial, formato de doble eliminación, y interfaz moderna con tema oscuro.

## 🚀 Características Implementadas

### ✅ **Sistema de Torneo**
- **Formato de doble eliminación** (Winners & Losers Bracket)
- **Validación de potencias de 2** (2, 4, 8, 16, 32 jugadores)
- **Emparejamiento aleatorio** al iniciar el torneo
- **Sistema de espera** en Losers Bracket
- **Gran Final** entre campeones de ambos brackets
- **Sistema de Reset** si gana el de Losers

### ✅ **Integración con API de Clash Royale**
- **Endpoint personalizado**: `/api/player/[tag]`
- **Datos completos del jugador**: Estadísticas, clan, arena, insignias
- **Validación de Player Tags** en frontend y backend
- **Manejo robusto de errores** con mensajes claros
- **Cache de 5 minutos** para optimizar requests
- **Rate limiting** respetado

### ✅ **Interfaz de Usuario**
- **Tema oscuro** con colores rojo y azul
- **Layout horizontal** como diagrama de torneo
- **Losers Bracket debajo** del Winners Bracket
- **Información de jugadores** en tiempo real
- **Modal detallado** con estadísticas completas
- **Responsive design** para móviles y escritorio

### ✅ **Funcionalidades Avanzadas**
- **Click en jugadores** para ver detalles
- **Carga automática** de datos de la API
- **Estados de loading** con indicadores visuales
- **Validación en tiempo real** de Player Tags
- **Enlaces externos** a RoyaleAPI
- **Manejo de errores** user-friendly

## 🛠️ Instalación y Configuración

### 1. **Instalación de Dependencias**
```bash
npm install
```

### 2. **Configuración de la API**
1. Ve a [Clash Royale Developer](https://developer.clashroyale.com/)
2. Crea una cuenta y una nueva aplicación
3. Copia el token generado
4. Crea el archivo `.env.local`:
```bash
CLASH_ROYALE_TOKEN=tu_token_aqui
```

### 3. **Ejecutar el Proyecto**
```bash
npm run dev
```

## 📁 Estructura del Proyecto

```
app/
├── api/
│   ├── player/[tag]/route.js    # Endpoint para datos de jugadores
│   └── clashroyale/route.js      # Endpoint alternativo
├── page.js                       # Componente principal
└── layout.js                     # Layout base

lib/
├── clashroyale-utils.js          # Utilidades para API de Clash Royale
└── api-utils.js                  # Utilidades para manejo de errores

API_SETUP.md                      # Guía de configuración de API
```

## 🔧 Endpoints de la API

### **GET /api/player/[tag]**
Obtiene información completa de un jugador de Clash Royale.

**Parámetros:**
- `tag`: Player Tag del jugador (ej: `G9YV9GR8R` o `#G9YV9GR8R`)

**Respuesta exitosa:**
```json
{
  "basic": {
    "name": "Mohamed Light",
    "tag": "#G9YV9GR8R",
    "level": 70,
    "trophies": 10000,
    "bestTrophies": 10000
  },
  "battles": {
    "total": 23457,
    "wins": 18890,
    "losses": 4567,
    "threeCrowns": 3648,
    "winRate": "80.5"
  },
  "clan": {
    "name": "Sunlight",
    "tag": "#QYGL80RR",
    "role": "coLeader"
  },
  "arena": {
    "id": 54000031,
    "name": "Legendary Arena"
  },
  "league": { ... },
  "badges": [ ... ]
}
```

**Errores posibles:**
- `400`: Player Tag inválido
- `404`: Jugador no encontrado
- `429`: Rate limit excedido
- `500`: Error interno del servidor

## 🎮 Cómo Usar el Torneo

### **1. Registro de Jugadores**
- Agrega jugadores por nombre
- El sistema valida que sea potencia de 2
- Los jugadores pueden agregar su Player Tag después

### **2. Inicio del Torneo**
- Click en "Iniciar Torneo"
- Se generan los brackets aleatoriamente
- Comienza la primera ronda del Winners Bracket

### **3. Durante el Torneo**
- **Winners Bracket**: Arriba, progresión normal
- **Losers Bracket**: Abajo, se llena conforme hay perdedores
- **Selección de ganadores**: Click en el botón del ganador
- **Información de jugadores**: Click en cualquier jugador para ver detalles

### **4. Gran Final**
- Se genera automáticamente cuando hay campeones
- Si gana el de Losers → Reset (jugar otra vez)
- Si gana el de Winners → Campeón final

## 🔍 Validaciones Implementadas

### **Player Tags**
- Formato: `#XXXXXXXXX` (8-9 caracteres después del #)
- Solo letras mayúsculas y números
- Validación en frontend y backend

### **Número de Jugadores**
- Solo potencias de 2: 2, 4, 8, 16, 32, 64...
- Previene byes automáticos
- Mensaje de error claro

### **API Requests**
- Rate limiting respetado
- Cache de 5 minutos
- Manejo de errores robusto

## 🎨 Personalización

### **Colores**
```javascript
const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  red: '#FF4444',
  blue: '#4444FF',
  accent: '#FFD700'
};
```

### **Layout**
- Winners Bracket: Arriba
- Losers Bracket: Abajo
- Gran Final: Al final
- Modal: Centrado con overlay

## 🐛 Troubleshooting

### **Error 403 - Token inválido**
- Verifica que el token esté en `.env.local`
- Asegúrate de que la aplicación tenga permisos

### **Error 404 - Jugador no encontrado**
- Verifica el formato del Player Tag
- Asegúrate de que el jugador exista

### **Error 429 - Rate limit**
- Espera un momento antes de hacer más requests
- El sistema tiene cache de 5 minutos

### **Jugadores no cargan**
- Verifica la conexión a internet
- Revisa la consola del navegador para errores

## 📊 Estadísticas del Sistema

- **Requests por minuto**: 1000 (límite de API)
- **Cache**: 5 minutos por jugador
- **Validación**: Frontend + Backend
- **Errores manejados**: 6 tipos diferentes
- **Responsive**: Móvil + Escritorio

## 🚀 Próximas Mejoras

- [ ] Sistema de notificaciones toast
- [ ] Historial de torneos
- [ ] Exportar resultados
- [ ] Modo espectador
- [ ] Integración con Discord
- [ ] Estadísticas de torneos

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la consola del navegador
2. Verifica el archivo `.env.local`
3. Consulta la documentación de la API de Clash Royale
4. Revisa los logs del servidor

---

¡Disfruta organizando tu torneo de Clash Royale! 🎮🏆