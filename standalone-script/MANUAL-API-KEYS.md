# 🔑 Crear API Keys Manualmente

## ¿Por qué crear API keys manualmente?

Hay varios casos donde necesitas crear API keys sin pasar por Stripe:

- ✅ **Clientes de prueba** - Para testing interno
- ✅ **Acuerdos especiales** - Precios custom o lifetime deals
- ✅ **Partners** - Acceso gratuito para partners
- ✅ **Demos** - Keys temporales para demos
- ✅ **Migraciones** - Importar clientes de otro sistema

---

## 🚀 Métodos para Crear API Keys

### Método 1: Interface Web (Recomendado)

**Archivo:** `admin-create-key.html`

1. Abre `admin-create-key.html` en tu navegador
2. Configura la URL del webhook de n8n (línea 279)
3. Rellena el formulario:
   - Email del cliente (requerido)
   - Nombre del cliente (opcional)
   - Plan (free/pro/enterprise)
   - Límites custom (opcional)
   - Dominios autorizados (opcional)
   - Duración en meses
   - Opciones (never expires, send email)
4. Click en "Create API Key"
5. Copia el API key generado

**Ventajas:**
- ✅ Interface visual fácil de usar
- ✅ Validación de campos
- ✅ Vista previa de plan
- ✅ Copia fácil del API key

---

### Método 2: API Request (cURL)

**Endpoint:** `https://your-n8n.com/webhook/create-api-key`

#### Ejemplo Básico

```bash
curl -X POST https://your-n8n.com/webhook/create-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "john@example.com",
    "plan": "pro"
  }'
```

#### Ejemplo Completo

```bash
curl -X POST https://your-n8n.com/webhook/create-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "plan": "pro",
    "domains_limit": 10,
    "monthly_events_limit": 100000,
    "allowed_domains": "example.com,www.example.com",
    "duration_months": 12,
    "status": "active",
    "never_expires": false,
    "send_email": true,
    "notes": "Special deal - 50% discount"
  }'
```

#### Respuesta Exitosa

```json
{
  "success": true,
  "api_key": "rt_live_abc123xyz789...",
  "customer_email": "john@example.com",
  "plan": "pro",
  "status": "active",
  "expires_at": "2026-11-04T15:30:00Z",
  "message": "API key created successfully"
}
```

---

### Método 3: Directamente en NocoDB

Si prefieres crear el API key directamente en la base de datos:

1. Abre NocoDB
2. Ve a la tabla `api_keys`
3. Click en **Add New Record**
4. Rellena los campos:

```
api_key: rt_live_[genera 32 caracteres aleatorios]
customer_id: manual_[timestamp]
customer_name: John Doe
customer_email: john@example.com
subscription_id: null
plan: pro
status: active
domains_limit: 5
monthly_events_limit: 50000
features: basic_tracking,click_ids,analytics
allowed_domains: example.com,www.example.com
current_month_events: 0
created_at: [fecha actual]
expires_at: [fecha + 1 mes]
notes: Created manually
```

**⚠️ Importante:** Si creas el API key directamente en NocoDB, el email de bienvenida NO se enviará automáticamente.

---

## 📋 Parámetros Disponibles

### Campos Requeridos

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `customer_email` | String | Email del cliente | `john@example.com` |
| `plan` | String | Plan contratado | `free`, `pro`, `enterprise` |

### Campos Opcionales

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `customer_name` | String | - | Nombre del cliente |
| `customer_id` | String | `manual_[timestamp]` | ID custom del cliente |
| `subscription_id` | String | `null` | Stripe subscription ID (si aplica) |
| `status` | String | `active` | Estado: `active`, `pending`, `cancelled` |
| `domains_limit` | Number | Plan default | Límite de dominios |
| `monthly_events_limit` | Number | Plan default | Límite de eventos/mes |
| `features` | String | Plan default | Features (CSV) |
| `allowed_domains` | String | - | Dominios autorizados (CSV) |
| `duration_months` | Number | `1` | Duración en meses |
| `never_expires` | Boolean | `false` | Si es true, no expira nunca |
| `send_email` | Boolean | `true` | Enviar email de bienvenida |
| `notes` | String | - | Notas internas |

---

## 🎯 Casos de Uso

### Caso 1: Cliente de Prueba (30 días)

```json
{
  "customer_email": "test@example.com",
  "customer_name": "Test User",
  "plan": "pro",
  "duration_months": 1,
  "send_email": false,
  "notes": "Internal testing account"
}
```

### Caso 2: Lifetime Deal

```json
{
  "customer_email": "lifetime@example.com",
  "customer_name": "Lifetime Customer",
  "plan": "enterprise",
  "never_expires": true,
  "send_email": true,
  "notes": "AppSumo lifetime deal"
}
```

### Caso 3: Partner con Límites Custom

```json
{
  "customer_email": "partner@agency.com",
  "customer_name": "Marketing Agency",
  "plan": "enterprise",
  "domains_limit": 50,
  "monthly_events_limit": 1000000,
  "allowed_domains": "*.agency.com",
  "never_expires": true,
  "send_email": true,
  "notes": "Strategic partner - unlimited access"
}
```

### Caso 4: Demo Temporal (7 días)

```json
{
  "customer_email": "demo@prospect.com",
  "customer_name": "Prospect Demo",
  "plan": "pro",
  "duration_months": 0.25,
  "allowed_domains": "demo.prospect.com",
  "send_email": true,
  "notes": "7-day demo for sales call"
}
```

### Caso 5: Cliente Migrado de Otro Sistema

```json
{
  "customer_email": "existing@customer.com",
  "customer_name": "Existing Customer",
  "plan": "pro",
  "customer_id": "legacy_12345",
  "duration_months": 12,
  "allowed_domains": "customer.com,www.customer.com,app.customer.com",
  "send_email": true,
  "notes": "Migrated from old system - paid until Dec 2025"
}
```

---

## 🔒 Seguridad

### Proteger el Webhook

Para evitar que cualquiera pueda crear API keys, protege el webhook:

#### Opción 1: API Key en Header

Modifica el workflow de n8n para requerir un API key:

```javascript
// Añade este nodo al inicio del workflow
const authHeader = $input.item.json.headers['x-api-key'];
const validApiKey = 'your-secret-admin-key';

if (authHeader !== validApiKey) {
  return {
    json: {
      success: false,
      error: 'unauthorized',
      message: 'Invalid API key'
    }
  };
}
```

Luego usa el header en tus requests:

```bash
curl -X POST https://your-n8n.com/webhook/create-api-key \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-admin-key" \
  -d '{"customer_email": "test@example.com", "plan": "pro"}'
```

#### Opción 2: IP Whitelist

En n8n, configura el webhook para aceptar solo requests desde IPs específicas.

#### Opción 3: Basic Auth

Protege la URL del webhook con autenticación básica:

```bash
curl -X POST https://your-n8n.com/webhook/create-api-key \
  -u "admin:password" \
  -H "Content-Type: application/json" \
  -d '{"customer_email": "test@example.com", "plan": "pro"}'
```

---

## 📊 Gestión de API Keys Manuales

### Ver API Keys Manuales en NocoDB

Crea una vista filtrada:

**Filtro:**
- `customer_id` starts with `manual_`

**O:**
- `notes` is not empty

### Renovar API Key Manual

Para extender la duración de un API key:

1. Ve a NocoDB → tabla `api_keys`
2. Encuentra el registro por email o API key
3. Actualiza el campo `expires_at` con la nueva fecha
4. Opcionalmente, actualiza `notes` con la razón

### Desactivar API Key Manual

1. Ve a NocoDB → tabla `api_keys`
2. Encuentra el registro
3. Cambia `status` a `cancelled`
4. Añade fecha en `cancelled_at`

---

## 🔄 Automatizaciones Útiles

### Notificar Cuando se Crea API Key Manual

Añade un nodo de Slack/Email al workflow:

```json
{
  "name": "Notify Admin",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "channel": "#admin-notifications",
    "text": "🔑 New manual API key created\nEmail: {{$json.customer_email}}\nPlan: {{$json.plan}}\nBy: Admin"
  }
}
```

### Log de Auditoría

Crea una tabla `audit_log` en NocoDB para registrar todas las creaciones manuales:

```
- timestamp
- action (created/updated/deleted)
- api_key
- customer_email
- admin_user
- notes
```

---

## ✅ Checklist

Antes de crear API keys manualmente:

- [ ] Workflow `manual-api-key-creator.json` importado y activo
- [ ] URL del webhook configurada en `admin-create-key.html`
- [ ] Webhook protegido (API key, IP whitelist, o Basic Auth)
- [ ] Campo `notes` añadido a tabla `api_keys` en NocoDB
- [ ] SMTP configurado para enviar emails
- [ ] Probado con un email de prueba

---

## 🆘 Troubleshooting

### El API key no se crea

**Posibles causas:**
1. Webhook URL incorrecta
2. NocoDB credentials no configuradas
3. Campos requeridos faltantes
4. Error en el workflow de n8n

**Solución:**
- Revisa los logs del workflow en n8n
- Verifica que todos los nodos estén conectados
- Comprueba las credenciales de NocoDB

### El email no se envía

**Posibles causas:**
1. SMTP no configurado
2. `send_email` es `false`
3. Email inválido

**Solución:**
- Verifica las credenciales SMTP en n8n
- Comprueba que `send_email: true` en el request
- Revisa los logs del nodo de email

### El API key no valida

**Posibles causas:**
1. Status no es `active`
2. Fecha de expiración pasada
3. Dominio no autorizado

**Solución:**
- Verifica el status en NocoDB
- Comprueba la fecha `expires_at`
- Revisa `allowed_domains`

---

## 📚 Recursos

- **Workflow:** `n8n-workflows/manual-api-key-creator.json`
- **Interface:** `admin-create-key.html`
- **Schema:** `nocodb-schema.md`
- **Setup Guide:** `SETUP-GUIDE.md`

---

¡Ahora puedes crear API keys manualmente de forma fácil y segura! 🎉
