# 🏆 Torneo Clash Royale - Configuración de API

## Configuración de la API de Clash Royale

Para que el torneo funcione correctamente con datos reales de los jugadores, necesitas configurar la API de Clash Royale.

### Pasos para obtener el token:

1. **Ve a la página de desarrolladores**: https://developer.clashroyale.com/
2. **Crea una cuenta** o inicia sesión si ya tienes una
3. **Crea una nueva aplicación**:
   - Haz clic en "Create New Key"
   - Completa la información requerida
   - Selecciona los permisos necesarios
4. **Copia el token** generado

### Configuración del proyecto:

1. **Crea el archivo `.env.local`** en la raíz del proyecto:
```bash
CLASH_ROYALE_TOKEN=tu_token_aqui
```

2. **Reemplaza `tu_token_aqui`** con el token que obtuviste de la API

3. **Reinicia el servidor** de desarrollo:
```bash
npm run dev
```

### Ejemplo de token válido:
```
CLASH_ROYALE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzNDU2Nzg5MCwiZGV2SWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDEwODE2MDB9.example_signature
```

### Funcionalidades habilitadas con la API:

- ✅ **Información del jugador**: Nombre, nivel, trofeos
- ✅ **Estadísticas de batallas**: Victorias, derrotas, tres coronas
- ✅ **Información del clan**: Nombre del clan, rol
- ✅ **Arena actual**: Arena donde está el jugador
- ✅ **Estadísticas de liga**: Temporadas actuales y anteriores
- ✅ **Insignias**: Badges del jugador con imágenes
- ✅ **Link externo**: Enlace a RoyaleAPI para más detalles

### Sin API configurada:

- ❌ Solo se mostrará el nombre del jugador
- ❌ No habrá estadísticas ni información adicional
- ❌ El modal de detalles estará vacío

### Troubleshooting:

**Error 403**: Token inválido o sin permisos
- Verifica que el token sea correcto
- Asegúrate de que la aplicación tenga los permisos necesarios

**Error 404**: Jugador no encontrado
- Verifica que el Player Tag sea correcto
- El tag debe incluir el símbolo # (ej: #G9YV9GR8R)

**Error 429**: Límite de rate limit excedido
- La API tiene límites de requests por minuto
- Espera un momento antes de hacer más requests

### Rate Limits de la API:

- **Requests por minuto**: 1000
- **Requests por día**: 100,000
- **Cache recomendado**: 5 minutos (ya implementado)

¡Con esto tendrás un torneo completamente funcional con datos reales de Clash Royale! 🎮
