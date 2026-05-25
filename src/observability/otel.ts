/**
 * OpenTelemetry bootstrap.
 *
 * Importado como PRIMEIRA linha do main.ts (antes de qualquer import do NestJS)
 * para que a auto-instrumentação capture todas as bibliotecas (express, pg,
 * http, etc.).
 *
 * Para ativar o envio para um collector real, configure as variáveis de
 * ambiente OTEL_EXPORTER_OTLP_ENDPOINT / OTEL_EXPORTER_OTLP_HEADERS.
 * Sem elas, o SDK fica idle (sem custo, sem ruído).
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const otlpEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];

if (otlpEndpoint) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: 'fiap-fase3-app',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env['APP_VERSION'] ?? 'dev',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env['NODE_ENV'] ?? 'production',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${otlpEndpoint}/v1/metrics`,
      }),
      exportIntervalMillis: 15_000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown().catch((err) => console.error('OTel shutdown error', err));
  });

  // eslint-disable-next-line no-console
  console.log(`[otel] enabled, exporting to ${otlpEndpoint}`);
} else {
  // eslint-disable-next-line no-console
  console.log('[otel] OTEL_EXPORTER_OTLP_ENDPOINT not set, skipping SDK boot');
}
