import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('fiap-fase3-app');

/**
 * Counter: total de ordens de serviço criadas. Alimenta o dashboard
 * "Volume diário de OS".
 *
 * Labels recomendados: customer_id, vehicle_brand.
 */
export const ordersCreatedCounter = meter.createCounter('orders_created_total', {
  description: 'Total de ordens de serviço criadas',
});

/**
 * Histogram: tempo gasto em cada status da OS (segundos).
 * Alimenta o dashboard "Tempo médio por status".
 *
 * Labels recomendados: from_status, to_status.
 */
export const orderStatusDurationHistogram = meter.createHistogram(
  'order_status_duration_seconds',
  {
    description: 'Duração de cada status na ordem (em segundos)',
    unit: 's',
  },
);

/**
 * Counter: total de notificações enviadas (sucesso/falha).
 */
export const notificationsSentCounter = meter.createCounter('notifications_sent_total', {
  description: 'Notificações enviadas (e-mail) para clientes',
});
