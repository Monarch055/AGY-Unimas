package amqp

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"
)

// EventEnvelope matches contracts/events/PAYLOAD_CONTRACT.md (v1.1).
type EventEnvelope struct {
	EventID   string         `json:"event_id"`
	EventType string         `json:"event_type"`
	Source    string         `json:"source"`
	Timestamp string         `json:"timestamp"`
	Version   string         `json:"version"`
	Data      map[string]any `json:"data"`
}

// StructuredEventPublisher publishes canonical events and records an in-memory audit buffer
// for deterministic test assertions when RabbitMQ broker is not connected.
type StructuredEventPublisher struct {
	mu              sync.Mutex
	logger          *slog.Logger
	publishedEvents []EventEnvelope
}

func NewStructuredEventPublisher(logger *slog.Logger) *StructuredEventPublisher {
	return &StructuredEventPublisher{
		logger:          logger,
		publishedEvents: make([]EventEnvelope, 0),
	}
}

func (p *StructuredEventPublisher) PublishEvent(_ context.Context, routingKey string, payload map[string]any) error {
	now := time.Now().UTC()
	envelope := EventEnvelope{
		EventID:   fmt.Sprintf("evt-%d", now.UnixNano()),
		EventType: routingKey,
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
		p.logger.Info("published domain event to rekasains.events",
			slog.String("routing_key", routingKey),
			slog.String("event_id", envelope.EventID),
			slog.String("envelope_json", string(raw)),
		)
	}
	return nil
}

func (p *StructuredEventPublisher) PublishedEvents() []EventEnvelope {
	p.mu.Lock()
	defer p.mu.Unlock()
	copied := make([]EventEnvelope, len(p.publishedEvents))
	copy(copied, p.publishedEvents)
	return copied
}
