# 🗄️ NocoDB Database Schema

## Tablas Necesarias

### 1. Tabla: `api_keys`

Esta tabla almacena todas las API keys de los clientes.

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Integer (PK, Auto) | ID único | 1 |
| `api_key` | Text (Unique) | API key del cliente | `rt_live_abc123...` |
| `customer_id` | Text | Stripe Customer ID | `cus_ABC123` |
| `customer_name` | Text | Nombre del cliente | `John Doe` |
| `customer_email` | Email | Email del cliente | `john@example.com` |
| `subscription_id` | Text | Stripe Subscription ID | `sub_ABC123` |
| `plan` | SingleSelect | Plan contratado | `pro`, `enterprise` |
| `status` | SingleSelect | Estado de la suscripción | `active`, `cancelled`, `expired` |
| `domains_limit` | Number | Límite de dominios | `5` |
| `monthly_events_limit` | Number | Límite de eventos/mes | `50000` |
| `features` | LongText | Features habilitados (CSV) | `basic_tracking,click_ids,analytics` |
| `allowed_domains` | LongText | Dominios autorizados (CSV) | `example.com,www.example.com` |
| `current_month_events` | Number | Eventos usados este mes | `1234` |
| `created_at` | DateTime | Fecha de creación | `2025-11-04T15:30:00Z` |
| `updated_at` | DateTime | Última actualización | `2025-11-04T15:30:00Z` |
| `expires_at` | DateTime | Fecha de expiración | `2025-12-04T15:30:00Z` |
| `last_used_at` | DateTime | Último uso | `2025-11-04T15:30:00Z` |
| `cancelled_at` | DateTime | Fecha de cancelación | `null` |
| `notes` | LongText | Notas internas | `Created manually for testing` |

**Índices:**
- `api_key` (Unique)
- `customer_id`
- `subscription_id`
- `status`

---

### 2. Tabla: `validation_logs`

Esta tabla registra cada validación de licencia.

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Integer (PK, Auto) | ID único | 1 |
| `api_key` | Text | API key validada | `rt_live_abc123...` |
| `domain` | Text | Dominio solicitante | `example.com` |
| `url` | LongText | URL completa | `https://example.com/contact` |
| `valid` | Checkbox | ¿Validación exitosa? | `true` / `false` |
| `plan` | Text | Plan del cliente | `pro` |
| `error` | Text | Código de error (si hay) | `invalid_domain` |
| `user_agent` | LongText | User agent del navegador | `Mozilla/5.0...` |
| `timestamp` | DateTime | Fecha y hora | `2025-11-04T15:30:00Z` |

**Índices:**
- `api_key`
- `timestamp`
- `valid`

---

### 3. Tabla: `usage_stats` (Opcional - Para analytics)

Esta tabla almacena estadísticas de uso agregadas.

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | Integer (PK, Auto) | ID único | 1 |
| `api_key` | Text | API key | `rt_live_abc123...` |
| `domain` | Text | Dominio | `example.com` |
| `date` | Date | Fecha | `2025-11-04` |
| `events_count` | Number | Número de eventos | `150` |
| `validations_count` | Number | Número de validaciones | `45` |
| `unique_visitors` | Number | Visitantes únicos | `30` |

**Índices:**
- `api_key` + `date` (Compound)
- `date`

---

## 🔧 Configuración en NocoDB

### Paso 1: Crear Proyecto

1. Abre NocoDB
2. Click en **New Project**
3. Nombre: `Referrer Tracker`
4. Tipo: **External Database** (PostgreSQL, MySQL, etc.) o **SQLite**

### Paso 2: Crear Tabla `api_keys`

1. Click en **Add New Table**
2. Nombre: `api_keys`
3. Añade los campos según la tabla de arriba

**Configuración de campos importantes:**

**`plan` (SingleSelect):**
- Opciones: `free`, `pro`, `enterprise`
- Default: `pro`

**`status` (SingleSelect):**
- Opciones: `active`, `cancelled`, `expired`, `pending`
- Default: `active`

**`features` (LongText):**
- Ejemplo: `basic_tracking,click_ids,analytics,white_label`

**`allowed_domains` (LongText):**
- Ejemplo: `example.com,www.example.com,staging.example.com`
- Nota: Separados por comas, sin espacios

### Paso 3: Crear Tabla `validation_logs`

1. Click en **Add New Table**
2. Nombre: `validation_logs`
3. Añade los campos según la tabla de arriba

### Paso 4: Crear Tabla `usage_stats` (Opcional)

1. Click en **Add New Table**
2. Nombre: `usage_stats`
3. Añade los campos según la tabla de arriba

---

## 🔑 Obtener Credenciales de NocoDB

### Para n8n

1. En NocoDB, ve a **Settings** (⚙️)
2. Click en **API Tokens**
3. Click en **Create Token**
4. Nombre: `n8n Integration`
5. Copia el token generado

### Configurar en n8n

1. Ve a **Credentials** en n8n
2. Click en **New Credential**
3. Busca **NocoDB**
4. Completa:
   - **Host**: URL de tu NocoDB (ej: `https://nocodb.example.com`)
   - **API Token**: El token que copiaste
   - **Project ID**: ID de tu proyecto (lo encuentras en la URL)

---

## 📊 Vistas Útiles en NocoDB

### Vista 1: Active Subscriptions

**Filtros:**
- `status` = `active`

**Ordenar por:**
- `created_at` DESC

### Vista 2: Expiring Soon

**Filtros:**
- `status` = `active`
- `expires_at` < (Today + 7 days)

**Ordenar por:**
- `expires_at` ASC

### Vista 3: High Usage

**Filtros:**
- `current_month_events` > 80% of `monthly_events_limit`

**Ordenar por:**
- `current_month_events` DESC

### Vista 4: Recent Validations

**Tabla:** `validation_logs`

**Filtros:**
- `timestamp` > (Today - 1 day)

**Ordenar por:**
- `timestamp` DESC

---

## 🔄 Mantenimiento Automático

### Workflow: Reset Monthly Counters

Crea un workflow en n8n que se ejecute el día 1 de cada mes:

```json
{
  "name": "Reset Monthly Counters",
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "mode": "everyMonth",
              "dayOfMonth": 1,
              "hour": 0,
              "minute": 0
            }
          ]
        }
      }
    },
    {
      "name": "NocoDB - Reset Counters",
      "type": "n8n-nodes-base.nocoDb",
      "parameters": {
        "operation": "update",
        "tableId": "api_keys",
        "updateKey": "id",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldName": "current_month_events",
              "fieldValue": "0"
            }
          ]
        }
      }
    }
  ]
}
```

### Workflow: Check Expired Subscriptions

Ejecutar diariamente para marcar suscripciones expiradas:

```json
{
  "name": "Check Expired Subscriptions",
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "mode": "everyDay",
              "hour": 2,
              "minute": 0
            }
          ]
        }
      }
    },
    {
      "name": "NocoDB - Find Expired",
      "type": "n8n-nodes-base.nocoDb",
      "parameters": {
        "operation": "getAll",
        "tableId": "api_keys",
        "options": {
          "where": "(status,eq,active)~and(expires_at,lt,{{new Date().toISOString()}})"
        }
      }
    },
    {
      "name": "NocoDB - Mark as Expired",
      "type": "n8n-nodes-base.nocoDb",
      "parameters": {
        "operation": "update",
        "tableId": "api_keys",
        "updateKey": "id",
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldName": "status",
              "fieldValue": "expired"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 📈 Queries Útiles

### Clientes Activos

```sql
SELECT COUNT(*) as active_customers
FROM api_keys
WHERE status = 'active';
```

### Revenue Mensual Estimado

```sql
SELECT 
  plan,
  COUNT(*) as customers,
  CASE 
    WHEN plan = 'pro' THEN COUNT(*) * 29
    WHEN plan = 'enterprise' THEN COUNT(*) * 99
    ELSE 0
  END as monthly_revenue
FROM api_keys
WHERE status = 'active'
GROUP BY plan;
```

### Top Dominios por Uso

```sql
SELECT 
  domain,
  COUNT(*) as validations,
  SUM(CASE WHEN valid = true THEN 1 ELSE 0 END) as successful
FROM validation_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY domain
ORDER BY validations DESC
LIMIT 10;
```

### Clientes Cerca del Límite

```sql
SELECT 
  customer_email,
  plan,
  current_month_events,
  monthly_events_limit,
  ROUND((current_month_events::float / monthly_events_limit) * 100, 2) as usage_percent
FROM api_keys
WHERE 
  status = 'active'
  AND (current_month_events::float / monthly_events_limit) > 0.8
ORDER BY usage_percent DESC;
```

---

## 🔐 Seguridad

### Permisos Recomendados

**API Token para n8n:**
- Lectura: ✅ Todas las tablas
- Escritura: ✅ Todas las tablas
- Eliminar: ❌ No necesario

**API Token para Dashboard (si creas uno):**
- Lectura: ✅ Solo `api_keys` y `validation_logs`
- Escritura: ✅ Solo campo `allowed_domains` en `api_keys`
- Eliminar: ❌ No

### Backup

Configura backups automáticos:
- **Frecuencia**: Diaria
- **Retención**: 30 días
- **Ubicación**: S3, Google Drive, o similar

---

## ✅ Checklist de Configuración

- [ ] NocoDB instalado y accesible
- [ ] Proyecto creado
- [ ] Tabla `api_keys` creada con todos los campos
- [ ] Tabla `validation_logs` creada
- [ ] API Token generado
- [ ] Credenciales configuradas en n8n
- [ ] Workflows importados y activos
- [ ] Vistas útiles creadas
- [ ] Workflows de mantenimiento configurados
- [ ] Backups automáticos configurados

---

¡Tu base de datos NocoDB está lista para el sistema de licencias! 🎉
