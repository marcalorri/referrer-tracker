# 📊 Referrer Tracker - Standalone Script

Script JavaScript universal para rastrear fuentes de tráfico, parámetros UTM y click IDs en aplicaciones web sin CMS (Laravel, Next.js, React, Vue, etc.).

## 🎯 Características

- ✅ **Framework-agnostic**: Funciona con cualquier aplicación web
- 🍪 **Gestión automática de cookies**: Almacena valores de tracking por 30 días
- 🔍 **Detección inteligente de fuentes**: Identifica Google, Facebook, Twitter, etc.
- 📊 **Parámetros UTM completos**: source, medium, campaign
- 🎯 **Click IDs**: gclid, fbclid, msclkid, ttclid
- 🔄 **Auto-fill de formularios**: Rellena campos ocultos automáticamente
- 🐛 **Modo debug**: Logging detallado en consola
- 🚀 **Zero dependencies**: No requiere jQuery ni otras librerías

## 📖 Documentación

**Abre el archivo `INSTRUCCIONES.html` en tu navegador** para ver la documentación completa con ejemplos de uso para todos los frameworks.

## 📦 Instalación Rápida

```html
<script src="referrer-tracker.js"></script>
```

## 🚀 Uso Básico

```html
<form action="/submit" method="POST">
    <input type="text" name="name" required>
    <input type="email" name="email" required>
    
    <!-- Campos ocultos - se rellenan automáticamente -->
    <input type="hidden" name="rt_source" class="js-rt-source">
    <input type="hidden" name="rt_medium" class="js-rt-medium">
    <input type="hidden" name="rt_campaign" class="js-rt-campaign">
    <input type="hidden" name="rt_referrer" class="js-rt-referrer">
    
    <!-- Click IDs (opcional pero recomendado) -->
    <input type="hidden" name="rt_gclid" class="js-rt-gclid">
    <input type="hidden" name="rt_fbclid" class="js-rt-fbclid">
    <input type="hidden" name="rt_msclkid" class="js-rt-msclkid">
    <input type="hidden" name="rt_ttclid" class="js-rt-ttclid">
    
    <button type="submit">Enviar</button>
</form>

<script src="referrer-tracker.js"></script>
```

### 📊 Click IDs Soportados

El script detecta automáticamente **todas las variaciones** de click IDs y las consolida:

- **Google Ads**: `gclid`, `wbraid`, `gbraid`, `dclid` → cookie `rt_gclid`
- **Facebook Ads**: `fbclid`, `fb_click_id`, `fbadid` → cookie `rt_fbclid`
- **Microsoft Ads**: `msclkid`, `msclid` → cookie `rt_msclkid`
- **TikTok Ads**: `ttclid`, `ttclid_ss`, `clickid` → cookie `rt_ttclid`

Para ejemplos completos de React, Next.js, Laravel y otros frameworks, **abre `INSTRUCCIONES.html`**.

## 📚 API Reference

### Métodos Públicos

#### `ReferrerTracker.getSource()`
Obtiene el valor de la fuente de tráfico.

```javascript
const source = ReferrerTracker.getSource();
// Ejemplos: 'google', 'facebook', 'direct', 'twitter'
```

#### `ReferrerTracker.getMedium()`
Obtiene el medio de tráfico.

```javascript
const medium = ReferrerTracker.getMedium();
// Ejemplos: 'organic', 'cpc', 'social', 'referral', 'none'
```

#### `ReferrerTracker.getCampaign()`
Obtiene el nombre de la campaña.

```javascript
const campaign = ReferrerTracker.getCampaign();
// Ejemplo: 'summer_sale_2024'
```

#### `ReferrerTracker.getReferrer()`
Obtiene la URL completa del referrer.

```javascript
const referrer = ReferrerTracker.getReferrer();
// Ejemplo: 'https://www.google.com/search?q=...'
```

#### `ReferrerTracker.getGclid()`
Obtiene el Google Click ID.

```javascript
const gclid = ReferrerTracker.getGclid();
// Ejemplo: 'Cj0KCQiA...'
```

#### `ReferrerTracker.getFbclid()`
Obtiene el Facebook Click ID.

```javascript
const fbclid = ReferrerTracker.getFbclid();
// Ejemplo: 'IwAR3x...'
```

#### `ReferrerTracker.getMsclkid()`
Obtiene el Microsoft Ads Click ID.

```javascript
const msclkid = ReferrerTracker.getMsclkid();
```

#### `ReferrerTracker.getTtclid()`
Obtiene el TikTok Click ID.

```javascript
const ttclid = ReferrerTracker.getTtclid();
```

#### `ReferrerTracker.getAll()`
Obtiene todos los valores de tracking en un objeto.

```javascript
const tracking = ReferrerTracker.getAll();
console.log(tracking);
// {
//   source: 'google',
//   medium: 'cpc',
//   campaign: 'summer_sale',
//   referrer: 'https://www.google.com',
//   gclid: 'Cj0KCQiA...',
//   fbclid: '',
//   msclkid: '',
//   ttclid: ''
// }
```

#### `ReferrerTracker.configure(options)`
Configura el comportamiento del tracker.

```javascript
ReferrerTracker.configure({
    debug: true,                  // Habilita logging en consola
    cookiePrefix: 'rt_',          // Prefijo de cookies
    cookieExpireDays: 30,         // Días de expiración de cookies
    cookiePath: '/',              // Path de las cookies
    autoFillFields: true,         // Auto-rellenar campos de formulario
    updateInterval: 500,          // Intervalo de actualización (ms)
    updateDuration: 10000         // Duración de actualizaciones (ms)
});
```

#### `ReferrerTracker.updateFields()`
Actualiza manualmente los campos del formulario.

```javascript
ReferrerTracker.updateFields();
```

## 🎨 Formas de Usar los Campos

El script soporta tres formas de identificar campos de formulario:

### 1. Por Clase CSS (Recomendado)
```html
<input type="hidden" name="source" class="js-rt-source">
<input type="hidden" name="medium" class="js-rt-medium">
<input type="hidden" name="campaign" class="js-rt-campaign">
<input type="hidden" name="referrer" class="js-rt-referrer">
<input type="hidden" name="gclid" class="js-rt-gclid">
<input type="hidden" name="fbclid" class="js-rt-fbclid">
<input type="hidden" name="msclkid" class="js-rt-msclkid">
<input type="hidden" name="ttclid" class="js-rt-ttclid">
```

### 2. Por ID
```html
<input type="hidden" id="rt-source">
<input type="hidden" id="rt-medium">
<input type="hidden" id="rt-campaign">
<input type="hidden" id="rt-referrer">
<input type="hidden" id="rt-gclid">
<input type="hidden" id="rt-fbclid">
<input type="hidden" id="rt-msclkid">
<input type="hidden" id="rt-ttclid">
```

### 3. Por Nombre
```html
<input type="hidden" name="rt_source">
<input type="hidden" name="rt_medium">
<input type="hidden" name="rt_campaign">
<input type="hidden" name="rt_referrer">
<input type="hidden" name="rt_gclid">
<input type="hidden" name="rt_fbclid">
<input type="hidden" name="rt_msclkid">
<input type="hidden" name="rt_ttclid">
```

## 🔍 Fuentes de Tráfico Detectadas

### Motores de Búsqueda
- **Google** → `source: 'google'`, `medium: 'organic'`
- **Bing** → `source: 'bing'`, `medium: 'organic'`
- **Yahoo** → `source: 'yahoo'`, `medium: 'organic'`
- **DuckDuckGo** → `source: 'duckduckgo'`, `medium: 'organic'`
- **Yandex** → `source: 'yandex'`, `medium: 'organic'`
- **Baidu** → `source: 'baidu'`, `medium: 'organic'`

### Redes Sociales
- **Facebook** → `source: 'facebook'`, `medium: 'social'`
- **Twitter/X** → `source: 'twitter'`, `medium: 'social'`
- **Instagram** → `source: 'instagram'`, `medium: 'social'`
- **LinkedIn** → `source: 'linkedin'`, `medium: 'social'`
- **Pinterest** → `source: 'pinterest'`, `medium: 'social'`
- **YouTube** → `source: 'youtube'`, `medium: 'social'`
- **Reddit** → `source: 'reddit'`, `medium: 'social'`
- **TikTok** → `source: 'tiktok'`, `medium: 'social'`

### Publicidad Pagada (Click IDs)
- **Google Ads** (`?gclid=...`) → `source: 'google'`, `medium: 'cpc'`
- **Facebook Ads** (`?fbclid=...`) → `source: 'facebook'`, `medium: 'paid-social'`
- **Microsoft Ads** (`?msclkid=...`) → `source: 'bing'`, `medium: 'cpc'`
- **TikTok Ads** (`?ttclid=...`) → `source: 'tiktok'`, `medium: 'paid-social'`

### Tráfico Directo
- **Sin referrer** → `source: 'direct'`, `medium: 'none'`

### Otros Referrers
- **Cualquier otro sitio** → `source: 'dominio.com'`, `medium: 'referral'`

## 🍪 Cookies Generadas

El script genera las siguientes cookies con prefijo `rt_`:

| Cookie | Descripción | Ejemplo |
|--------|-------------|---------|
| `rt_source` | Fuente de tráfico | `google`, `facebook`, `direct` |
| `rt_medium` | Medio de tráfico | `organic`, `cpc`, `social` |
| `rt_campaign` | Nombre de campaña | `summer_sale_2024` |
| `rt_referrer` | URL del referrer | `https://www.google.com` |
| `rt_gclid` | Google Click ID | `Cj0KCQiA...` |
| `rt_fbclid` | Facebook Click ID | `IwAR3x...` |
| `rt_msclkid` | Microsoft Click ID | `abc123...` |
| `rt_ttclid` | TikTok Click ID | `xyz789...` |

**Duración**: 30 días (configurable)  
**Path**: `/` (configurable)  
**SameSite**: `Lax`

## 🔧 Configuración Avanzada

### Modo Debug

```javascript
ReferrerTracker.configure({
    debug: true
});
```

Esto mostrará en la consola:
- Parámetros URL detectados
- Valores de cookies
- Actualizaciones de campos
- Errores y advertencias

### Personalizar Prefijo de Cookies

```javascript
ReferrerTracker.configure({
    cookiePrefix: 'my_tracker_'
});
```

### Deshabilitar Auto-Fill

Si prefieres gestionar los campos manualmente:

```javascript
ReferrerTracker.configure({
    autoFillFields: false
});

// Luego actualiza manualmente cuando lo necesites
document.getElementById('my-field').value = ReferrerTracker.getSource();
```

### Cambiar Duración de Cookies

```javascript
ReferrerTracker.configure({
    cookieExpireDays: 90 // 90 días en lugar de 30
});
```

## 📊 Ejemplos de URLs con Tracking

### URL con UTM Parameters
```
https://tudominio.com/landing?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale
```
**Resultado**:
- `source`: `google`
- `medium`: `cpc`
- `campaign`: `summer_sale`

### URL con Google Ads
```
https://tudominio.com/landing?gclid=Cj0KCQiA...
```
**Resultado**:
- `source`: `google`
- `medium`: `cpc`
- `gclid`: `Cj0KCQiA...`

### URL con Facebook Ads
```
https://tudominio.com/landing?fbclid=IwAR3x...&utm_campaign=black_friday
```
**Resultado**:
- `source`: `facebook`
- `medium`: `paid-social`
- `campaign`: `black_friday`
- `fbclid`: `IwAR3x...`

### Tráfico desde Google Orgánico
```
Referrer: https://www.google.com/search?q=...
```
**Resultado**:
- `source`: `google`
- `medium`: `organic`
- `campaign`: `none`

## 🎯 Casos de Uso

### 1. Análisis de Conversiones
Guarda los datos de tracking con cada lead/venta para saber qué canales convierten mejor.

### 2. Atribución de Marketing
Identifica qué campañas generan más resultados.

### 3. ROI de Publicidad
Conecta los click IDs con tus conversiones para medir el retorno de inversión.

### 4. Optimización de Campañas
Analiza qué fuentes y medios funcionan mejor para tu negocio.

## 🔒 Privacidad y GDPR

Este script:
- ✅ **No recopila datos personales** por sí mismo
- ✅ Solo almacena información técnica de navegación
- ✅ Usa cookies de primera parte
- ✅ No hace llamadas a servidores externos
- ⚠️ **Responsabilidad del desarrollador**: Asegúrate de cumplir con GDPR/RGPD según tu jurisdicción

## 🐛 Troubleshooting

### Los campos no se rellenan

1. Verifica que el script se carga antes del DOM
2. Activa el modo debug: `ReferrerTracker.configure({ debug: true })`
3. Revisa la consola para ver los valores detectados
4. Verifica que los campos tengan las clases/IDs correctos

### Las cookies no se guardan

1. Verifica que tu sitio use HTTPS (requerido para cookies)
2. Comprueba la configuración de `cookiePath`
3. Revisa las DevTools → Application → Cookies

### Los valores son incorrectos

1. Limpia las cookies existentes
2. Prueba con una URL con parámetros UTM
3. Verifica que no haya otros scripts interfiriendo

## 📝 Changelog

### v1.0.0 (2024)
- ✨ Lanzamiento inicial
- ✅ Soporte para UTM parameters
- ✅ Detección de fuentes de tráfico
- ✅ Click IDs (gclid, fbclid, msclkid, ttclid)
- ✅ Auto-fill de formularios
- ✅ Modo debug

## 📄 Licencia

GPL-2.0-or-later

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Envía un Pull Request

## 💬 Soporte

Para soporte y preguntas:
- 📧 Email: [tu-email@ejemplo.com]
- 🐛 Issues: [GitHub Issues]
- 📖 Documentación: Este README

## 🙏 Créditos

Basado en la lógica del plugin WordPress "Referrer Tracker for Forms and CMS".

---

**Hecho con ❤️ para la comunidad de desarrolladores**
