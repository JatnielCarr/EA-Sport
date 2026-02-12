# 🚀 Configuración de Stripe Webhooks

Este documento explica cómo configurar los webhooks de Stripe para procesar pagos automáticamente en la plataforma EA Sports Tournament.

## 📋 Requisitos Previos

1. **Cuenta de Stripe**: Debes tener una cuenta activa en Stripe
2. **Claves API**: Configuradas en tu archivo `.env`
3. **Servidor ejecutándose**: Tu aplicación debe estar corriendo y accesible desde internet

## 🔧 Configuración Automática (Recomendado)

### Paso 1: Configurar Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Se genera automáticamente
WEBHOOK_URL=https://tu-dominio.com/stripe/webhook  # Para producción
WEBHOOK_URL=http://localhost:3000/stripe/webhook   # Para desarrollo
```

### Paso 2: Ejecutar el Script de Configuración

```bash
npm run setup:webhook
```

Este comando:
- ✅ Verifica webhooks existentes
- 🗑️ Elimina webhooks duplicados
- ✨ Crea un nuevo webhook endpoint
- 🔑 Genera y muestra el webhook secret

### Paso 3: Copiar el Webhook Secret

El script te mostrará algo como:

```
🔐 Webhook Secret: whsec_abc123...
```

Copia este valor y agrégalo a tu `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

## 🔧 Configuración Manual (Alternativa)

Si prefieres configurar manualmente:

### 1. Acceder al Dashboard de Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navega a **Developers** → **Webhooks**
3. Haz clic en **"Add endpoint"**

### 2. Configurar el Endpoint

- **Endpoint URL**: `https://tu-dominio.com/stripe/webhook`
- **Events to listen for**: Selecciona estos eventos:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 3. Copiar el Webhook Secret

Después de crear el webhook, copia el **Signing secret** y agrégalo a tu `.env`.

## 🎯 Eventos Procesados

El webhook maneja automáticamente:

### 💳 Pagos Únicos
- **Entradas a torneos**: Registra revenue y actualiza estado del torneo
- **Cambios de nombre**: Aprueba el cambio de nombre de usuario
- **Recargas de saldo**: Agrega balance al usuario
- **Pagos genéricos**: Registra cualquier otro tipo de pago

### 📊 Suscripciones
- **Creación**: Activa suscripción y registra revenue inicial
- **Actualización**: Actualiza plan y estado de suscripción
- **Cancelación**: Cancela suscripción al final del período
- **Renovación**: Registra revenue recurrente

### 💰 Revenue Automático
- Calcula comisiones automáticamente
- Registra todas las transacciones en la base de datos
- Actualiza métricas de revenue en tiempo real

## 🧪 Probar Webhooks

### Endpoint de Prueba

```bash
POST /stripe/webhook/test
```

Envía un evento simulado para probar el procesamiento:

```json
{
  "eventType": "checkout.session.completed",
  "data": {
    "id": "cs_test_123",
    "metadata": {
      "userId": "user_123",
      "type": "tournament_entry",
      "tournamentId": "tournament_123",
      "teamId": "team_123",
      "entryFee": "500"
    }
  }
}
```

### Verificar Estado

```bash
GET /stripe/webhook/status
```

Retorna el estado de conexión del webhook.

## 🔒 Seguridad

- ✅ **Verificación de firma**: Todos los webhooks verifican la firma de Stripe
- ✅ **Validación de datos**: Se valida que todos los campos requeridos estén presentes
- ✅ **Manejo de errores**: Errores se registran pero no detienen el procesamiento
- ✅ **Idempotencia**: Los eventos se procesan de forma idempotente

## 🚨 Solución de Problemas

### Webhook no se recibe
1. Verifica que la URL sea accesible desde internet
2. Revisa los logs del servidor
3. Usa herramientas como ngrok para desarrollo local

### Firma inválida
1. Asegúrate de que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
2. Verifica que no haya espacios extra en la variable de entorno

### Eventos no se procesan
1. Revisa los logs del servidor para errores
2. Verifica que el usuario/torneo existe en la base de datos
3. Usa el endpoint de prueba para debuggear

## 📊 Monitoreo

Los webhooks registran automáticamente:
- ✅ Eventos procesados exitosamente
- ❌ Errores de procesamiento
- 💰 Revenue generado
- 📈 Métricas de conversión

Revisa los logs de tu servidor para monitorear el procesamiento de pagos.

---

## 🎉 ¡Listo!

Con los webhooks configurados, tu plataforma procesará pagos automáticamente y generará revenue sin intervención manual. ¡Tu negocio de esports está listo para escalar! 🚀