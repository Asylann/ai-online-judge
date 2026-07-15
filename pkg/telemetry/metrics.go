// Package telemetry defines shared OpenTelemetry tracing and Prometheus metrics.
package telemetry

import (
	"github.com/prometheus/client_golang/prometheus"
)

var (
	// SubmissionCounter tracks total code submissions finalized across the platform,
	// partitioned by programming language and final status/verdict (e.g. Accepted, WA, TLE).
	SubmissionCounter = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "ai_judge",
			Name:      "submissions_total",
			Help:      "Total number of submissions processed, partitioned by language and verdict status.",
		},
		[]string{"language", "status"},
	)

	// JudgeLatencyHistogram tracks exact milliseconds spent waiting for the Judge0 sandbox execution.
	// Used to monitor our core SLO ("99% of submissions are graded within 2.5 seconds").
	JudgeLatencyHistogram = prometheus.NewHistogram(
		prometheus.HistogramOpts{
			Namespace: "ai_judge",
			Name:      "judge_latency_milliseconds",
			Help:      "Exact latency in milliseconds spent executing code inside the Judge0 sandbox.",
			Buckets:   []float64{50, 100, 250, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000},
		},
	)

	// ActiveWebSocketsGauge tracks the number of currently connected users in the websocket-service.
	ActiveWebSocketsGauge = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "ai_judge",
			Name:      "active_websockets",
			Help:      "Current number of active WebSocket client connections.",
		},
	)
)

func init() {
	// Register global Prometheus metrics
	prometheus.MustRegister(SubmissionCounter)
	prometheus.MustRegister(JudgeLatencyHistogram)
	prometheus.MustRegister(ActiveWebSocketsGauge)
}
