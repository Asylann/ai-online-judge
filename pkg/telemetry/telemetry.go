// Package telemetry configures OpenTelemetry distributed tracing and provides
// carriers for AMQP and HTTP context propagation across microservices.
package telemetry

import (
	"context"
	"fmt"
	"strings"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// InitTracer initializes and registers the global OpenTelemetry tracer provider
// with an OTLP HTTP exporter pointing to Jaeger (or any OTLP trace receiver).
// It returns the SDK TracerProvider so the caller can invoke Shutdown(ctx) during graceful exit.
func InitTracer(serviceName, jaegerEndpoint string) (*sdktrace.TracerProvider, error) {
	ctx := context.Background()

	// Clean up endpoint string so otlptracehttp.WithEndpoint works predictably whether
	// jaegerEndpoint is passed as "jaeger:4318", "http://jaeger:4318", or "jaeger:4318/v1/traces".
	endpoint := strings.TrimPrefix(jaegerEndpoint, "http://")
	endpoint = strings.TrimPrefix(endpoint, "https://")
	endpoint = strings.TrimSuffix(endpoint, "/v1/traces")

	exporter, err := otlptracehttp.New(ctx,
		otlptracehttp.WithEndpoint(endpoint),
		otlptracehttp.WithInsecure(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTLP trace exporter: %w", err)
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTEL resource: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return tp, nil
}

// AMQPHeadersCarrier adapts amqp.Table to propagation.TextMapCarrier for trace context propagation across RabbitMQ.
type AMQPHeadersCarrier amqp.Table

// Get retrieves a single value for a given key from the AMQP table headers.
func (c AMQPHeadersCarrier) Get(key string) string {
	if v, ok := c[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// Set stores the key-value pair in the AMQP table headers.
func (c AMQPHeadersCarrier) Set(key string, value string) {
	c[key] = value
}

// Keys lists all keys currently stored in the AMQP table headers.
func (c AMQPHeadersCarrier) Keys() []string {
	keys := make([]string, 0, len(c))
	for k := range c {
		keys = append(keys, k)
	}
	return keys
}
