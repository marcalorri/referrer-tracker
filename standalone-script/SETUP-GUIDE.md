# 🚀 Guía Completa de Implementación - Sistema de Licencias con n8n + Stripe

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Configurar Stripe](#configurar-stripe)
3. [Configurar n8n](#configurar-n8n)
4. [Configurar Base de Datos](#configurar-base-de-datos)
5. [Importar Workflows](#importar-workflows)
6. [Configurar Webhooks](#configurar-webhooks)
7. [Probar el Sistema](#probar-el-sistema)
8. [Crear Landing Page](#crear-landing-page)

---

## 1. Requisitos

### Servicios Necesarios

- ✅ **n8n** (self-hosted o n8n.cloud)
- ✅ **Stripe** (cuenta activa)
- ✅ **PostgreSQL** (o cualquier base de datos compatible con n8n)
- ✅ **Dominio** (para webhooks y API)
- ✅ **Servidor SMTP** (para enviar emails)

### Costos Estimados

| Servicio | Costo Mensual |
|----------|---------------|
| n8n Cloud (Starter) | $20/mes |
| PostgreSQL (Supabase free) | $0 |
| Stripe | $0 (comisión por transacción) |
| Dominio | ~$1/mes |
| **TOTAL** | **~$21/mes** |

---

## 2. Configurar Stripe

### 2.1 Crear Cuenta

1. Ve a [stripe.com](https://stripe.com)
2. Crea una cuenta
3. Completa la verificación de identidad

### 2.2 Crear Productos

**Producto 1: Free Plan**
```
Nombre: Referrer Tracker - Free
Precio: $0/mes (o gratis)
Descripción: Basic tracking for 1 domain

Metadata:
- plan: free
- domains: 1
- events: 1000
- features: basic_tracking
- allowed_domains: (vacío - el cliente lo configurará)
```

**Producto 2: Pro Plan**
```
Nombre: Referrer Tracker - Pro
Precio: $29/mes
Descripción: Advanced tracking for up to 5 domains

Metadata:
- plan: pro
- domains: 5
- events: 50000
- features: basic_tracking,click_ids,analytics
- allowed_domains: (vacío - el cliente lo configurará)
```

**Producto 3: Enterprise Plan**
```
Nombre: Referrer Tracker - Enterprise
Precio: $99/mes
Descripción: Unlimited tracking with white-label

Metadata:
- plan: enterprise
- domains: unlimited
- events: unlimited
- features: basic_tracking,click_ids,analytics,white_label,priority_support
- allowed_domains: (vacío - el cliente lo configurará)
```

### 2.3 Obtener API Keys

1. Ve a **Developers** → **API keys**
2. Copia:
   - **Publishable key**: `pk_live_...` (para tu landing page)
   - **Secret key**: `sk_live_...` (para n8n)

### 2.4 Configurar Webhook en Stripe

1. Ve a **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://tu-n8n.com/webhook/stripe-webhook`
4. Selecciona estos eventos:
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Guarda el **Signing secret**: `whsec_...`

---

## 3. Configurar n8n

### 3.1 Instalar n8n

**Opción A: n8n Cloud (Recomendado)**
1. Ve a [n8n.cloud](https://n8n.cloud)
2. Crea una cuenta
3. Listo! ✅

**Opción B: Self-hosted (Docker)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 3.2 Configurar Credenciales

#### Stripe API Key

1. En n8n, ve a **Credentials** → **New**
2. Busca "HTTP Header Auth"
3. Nombre: `Stripe API Key`
4. Header Name: `Authorization`
5. Header Value: `Bearer sk_live_TU_SECRET_KEY_AQUI`

#### PostgreSQL

1. Ve a **Credentials** → **New**
2. Busca "Postgres"
3. Completa:
   - Host: `tu-servidor.com`
   - Database: `referrer_tracker`
   - User: `postgres`
   - Password: `tu-password`
   - Port: `5432`

#### SMTP (para emails)

1. Ve a **Credentials** → **New**
2. Busca "SMTP"
3. Completa con tu proveedor:
   - **Gmail**: smtp.gmail.com, port 587
   - **SendGrid**: smtp.sendgrid.net, port 587
   - **Mailgun**: smtp.mailgun.org, port 587

---

## 4. Configurar Base de Datos

### 4.1 Crear Tablas

Conecta a tu PostgreSQL y ejecuta:

```sql
-- Tabla para almacenar API keys
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    subscription_id VARCHAR(255),
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    INDEX idx_api_key (api_key),
    INDEX idx_customer_id (customer_id)
);

-- Tabla para logs de validación
CREATE TABLE license_logs (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    url TEXT,
    valid BOOLEAN,
    plan VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_api_key (api_key),
    INDEX idx_timestamp (timestamp)
);

-- Tabla para uso/analytics
CREATE TABLE usage_stats (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    events_count INT DEFAULT 0,
    date DATE NOT NULL,
    INDEX idx_api_key_date (api_key, date)
);
```

### 4.2 Usar Supabase (Alternativa Gratis)

1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto
3. En **SQL Editor**, pega el SQL de arriba
4. Obtén las credenciales en **Settings** → **Database**

---

## 5. Importar Workflows

### 5.1 Importar "License Validator"

1. En n8n, ve a **Workflows** → **Import from File**
2. Selecciona `n8n-workflows/license-validator.json`
3. Configura las credenciales:
   - Stripe API Key
   - PostgreSQL
4. **Activa** el workflow

### 5.2 Importar "Stripe Webhook Handler"

1. Ve a **Workflows** → **Import from File**
2. Selecciona `n8n-workflows/stripe-webhook-handler.json`
3. Configura las credenciales:
   - Stripe API Key
   - PostgreSQL
   - SMTP
4. **Activa** el workflow

### 5.3 Obtener URLs de Webhooks

Después de activar los workflows:

1. **License Validator**:
   - URL: `https://tu-n8n.com/webhook/validate`
   - Úsala en el script: `licenseServer: 'https://tu-n8n.com/webhook/validate'`

2. **Stripe Webhook Handler**:
   - URL: `https://tu-n8n.com/webhook/stripe-webhook`
   - Configúrala en Stripe (paso 2.4)

---

## 6. Configurar Webhooks

### 6.1 Actualizar Script JavaScript

Edita `referrer-tracker.js`:

```javascript
const CONFIG = {
    apiKey: '',
    licenseServer: 'https://TU-N8N.com/webhook/validate', // ← Cambia esto
    validateOnInit: true,
    // ... resto de config
};
```

### 6.2 Probar Webhook de Stripe

En Stripe Dashboard:
1. Ve a **Developers** → **Webhooks**
2. Click en tu webhook
3. Click **Send test webhook**
4. Selecciona `customer.subscription.created`
5. Verifica que n8n reciba el evento

---

## 7. Probar el Sistema

### 7.1 Crear Cliente de Prueba

1. En Stripe, activa **Test Mode**
2. Crea una suscripción de prueba:
   ```
   Email: test@example.com
   Tarjeta: 4242 4242 4242 4242
   Fecha: 12/34
   CVC: 123
   ```

3. El workflow debería:
   - Generar un API key
   - Guardarlo en la base de datos
   - Enviar email de bienvenida

### 7.2 Probar Validación

Usa este HTML de prueba:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test License</title>
</head>
<body>
    <h1>Testing License Validation</h1>
    <div id="result"></div>

    <script src="referrer-tracker.js"></script>
    <script>
        ReferrerTracker.configure({
            apiKey: 'rt_live_TU_API_KEY_DE_PRUEBA',
            debug: true
        });

        setTimeout(() => {
            const data = ReferrerTracker.getAll();
            document.getElementById('result').innerHTML = 
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        }, 2000);
    </script>
</body>
</html>
```

### 7.3 Verificar en Consola

Deberías ver:
```
[ReferrerTracker] Initializing Referrer Tracker
[ReferrerTracker] Validating license with server...
[ReferrerTracker] License validated successfully
[ReferrerTracker] License validated - Tracking enabled
```

---

## 8. Crear Landing Page

### 8.1 Estructura Básica

```html
<!DOCTYPE html>
<html>
<head>
    <title>Referrer Tracker - Track Your Traffic Sources</title>
    <script src="https://js.stripe.com/v3/"></script>
</head>
<body>
    <header>
        <h1>📊 Referrer Tracker</h1>
        <p>Track UTM parameters and traffic sources automatically</p>
    </header>

    <section id="pricing">
        <div class="plan">
            <h2>Free</h2>
            <p class="price">$0/month</p>
            <ul>
                <li>Basic tracking</li>
                <li>1 domain</li>
                <li>1,000 events/month</li>
            </ul>
            <button onclick="subscribe('price_free_id')">Get Started</button>
        </div>

        <div class="plan featured">
            <h2>Pro</h2>
            <p class="price">$29/month</p>
            <ul>
                <li>All Free features</li>
                <li>Click ID tracking</li>
                <li>5 domains</li>
                <li>50,000 events/month</li>
                <li>Analytics dashboard</li>
            </ul>
            <button onclick="subscribe('price_pro_id')">Subscribe</button>
        </div>

        <div class="plan">
            <h2>Enterprise</h2>
            <p class="price">$99/month</p>
            <ul>
                <li>All Pro features</li>
                <li>Unlimited domains</li>
                <li>Unlimited events</li>
                <li>White-label</li>
                <li>Priority support</li>
            </ul>
            <button onclick="subscribe('price_enterprise_id')">Contact Sales</button>
        </div>
    </section>

    <script>
        const stripe = Stripe('pk_live_TU_PUBLISHABLE_KEY');

        async function subscribe(priceId) {
            const { error } = await stripe.redirectToCheckout({
                lineItems: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                successUrl: 'https://referrertracker.com/success',
                cancelUrl: 'https://referrertracker.com/pricing',
            });

            if (error) {
                console.error(error);
            }
        }
    </script>
</body>
</html>
```

### 8.2 Página de Éxito

Crea `success.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Referrer Tracker!</title>
</head>
<body>
    <h1>🎉 Welcome!</h1>
    <p>Your subscription is active. Check your email for your API key.</p>
    <a href="/dashboard">Go to Dashboard</a>
</body>
</html>
```

---

## 9. Dashboard del Cliente (Opcional)

### 9.1 Crear Workflow "Get API Key Info"

```json
{
  "name": "Get API Key Info",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "api-key-info",
        "method": "GET"
      }
    },
    {
      "name": "Query Database",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM api_keys WHERE api_key = $1",
        "additionalFields": {
          "queryParameters": "={{$json.query.api_key}}"
        }
      }
    },
    {
      "name": "Get Usage Stats",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT date, SUM(events_count) as total FROM usage_stats WHERE api_key = $1 GROUP BY date ORDER BY date DESC LIMIT 30"
      }
    },
    {
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "responseBody": "={{JSON.stringify($json)}}"
      }
    }
  ]
}
```

### 9.2 Dashboard Simple (HTML)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard - Referrer Tracker</title>
</head>
<body>
    <h1>Your Dashboard</h1>
    
    <div id="api-key-section">
        <h2>Your API Key</h2>
        <input type="text" id="api-key-display" readonly>
        <button onclick="copyApiKey()">Copy</button>
    </div>

    <div id="usage-section">
        <h2>Usage Statistics</h2>
        <canvas id="usage-chart"></canvas>
    </div>

    <div id="domains-section">
        <h2>Authorized Domains</h2>
        <ul id="domains-list"></ul>
        <input type="text" id="new-domain" placeholder="example.com">
        <button onclick="addDomain()">Add Domain</button>
    </div>

    <script>
        // Obtener API key del localStorage o URL
        const apiKey = localStorage.getItem('rt_api_key');
        
        // Cargar info
        fetch(`https://tu-n8n.com/webhook/api-key-info?api_key=${apiKey}`)
            .then(r => r.json())
            .then(data => {
                document.getElementById('api-key-display').value = data.api_key;
                // Renderizar stats...
            });
    </script>
</body>
</html>
```

---

## 10. Checklist Final

### Antes de Lanzar

- [ ] Stripe en modo producción
- [ ] Webhooks configurados y probados
- [ ] n8n workflows activos
- [ ] Base de datos con backups
- [ ] Emails de bienvenida funcionando
- [ ] Landing page publicada
- [ ] Script minificado y ofuscado
- [ ] Documentación actualizada
- [ ] Términos de servicio y privacidad
- [ ] Sistema de soporte (email/chat)

### Monitoreo

- [ ] Configurar alertas en n8n
- [ ] Monitorear logs de validación
- [ ] Revisar métricas de Stripe
- [ ] Analizar tasa de conversión
- [ ] Recopilar feedback de clientes

---

## 11. Soporte y Mantenimiento

### Tareas Mensuales

- Revisar logs de errores
- Actualizar documentación
- Responder tickets de soporte
- Analizar métricas de uso
- Optimizar workflows

### Escalabilidad

Si creces mucho:
1. Migrar de n8n Cloud a self-hosted
2. Usar Redis para caché
3. Implementar CDN para el script
4. Añadir más servidores de validación

---

## 🎉 ¡Listo!

Tu sistema de licencias está completo. Ahora puedes:

1. **Vender suscripciones** en Stripe
2. **Generar API keys** automáticamente
3. **Validar licencias** en tiempo real
4. **Gestionar clientes** desde Stripe
5. **Monitorear uso** en tu base de datos

**Siguiente paso**: ¡Lanzar y conseguir tus primeros clientes! 🚀
