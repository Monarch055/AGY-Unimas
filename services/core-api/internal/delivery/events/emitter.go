package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"
)

// InternalEventEnvelope matches contracts/events/PAYLOAD_CONTRACT.md (v1.1 — Zero-RabbitMQ Direct REST/SSE).
type InternalEventEnvelope struct {
	EventID   string         `json:"event_id"`
	EventType string         `json:"event_type"`
	Source    string         `json:"source"`
	Timestamp string         `json:"timestamp"`
	Version   string         `json:"version"`
	Data      map[string]any `json:"data"`
}

// InternalSSEEventEmitter broadcasts internal events over Server-Sent Events (SSE) & Go Goroutines
// with zero external message broker dependencies.
type InternalSSEEventEmitter struct {
	mu              sync.Mutex
	logger          *slog.Logger
	publishedEvents []InternalEventEnvelope
}

func NewInternalSSEEventEmitter(logger *slog.Logger) *InternalSSEEventEmitter {
	return &InternalSSEEventEmitter{
		logger:          logger,
		publishedEvents: make([]InternalEventEnvelope, 0),
	}
}

func (p *InternalSSEEventEmitter) PublishEvent(_ context.Context, eventType string, payload map[string]any) error {
	now := time.Now().UTC()
	envelope := InternalEventEnvelope{
		EventID:   fmt.Sprintf("evt-%d", now.UnixNano()),
		EventType: eventType,
		Source:    "services/core-api",
		Timestamp: now.Format(time.RFC3339),
		Version:   "1.1",
		Data:      payload,
	}

	p.mu.Lock()
	p.publishedEvents = append(p.publishedEvents, envelope)
	p.mu.Unlock()

	if p.logger != nil {
		raw, _ := json.Marshal(envelope)
		p.logger.Info("emitted internal SSE/background event",
			slog.String("event_type", eventType),
			slog.String("event_id", envelope.EventID),
			slog.String("envelope_json", string(raw)),
		)
	}
	return nil
}

func (p *InternalSSEEventEmitter) PublishedEvents() []InternalEventEnvelope {
	p.mu.Lock()
	defer p.mu.Unlock()
	copied := make([]InternalEventEnvelope, len(p.publishedEvents))
	copy(copied, p.publishedEvents)
	return copied
}
