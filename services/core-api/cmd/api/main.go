package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rekasains/core-api/internal/delivery/amqp"
	httpdelivery "github.com/rekasains/core-api/internal/delivery/http"
	"github.com/rekasains/core-api/internal/gateway"
	"github.com/rekasains/core-api/internal/repository"
	"github.com/rekasains/core-api/internal/usecase"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	aiAgentBaseURL := os.Getenv("AI_AGENT_BASE_URL")
	if aiAgentBaseURL == "" {
		aiAgentBaseURL = "http://localhost:8081/ai/v1"
	}

	// Layer 3 & 4 Wiring (Dependency Injection)
	seededStore := repository.NewSeededStore()
	adkGateway := gateway.NewHybridADKGateway(aiAgentBaseURL)
	eventPub := amqp.NewStructuredEventPublisher(logger)

	controlPlaneUC := usecase.NewRekaSainsControlPlaneUseCase(
		seededStore,
		seededStore,
		seededStore,
		adkGateway,
		eventPub,
	)

	handler := httpdelivery.NewServerHandler(controlPlaneUC, logger)

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("starting RekaSains Core Control Plane API",
			slog.String("port", port),
			slog.String("ai_agent_base_url", aiAgentBaseURL),
		)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server listen failure", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	logger.Info("shutting down RekaSains Core Control Plane API gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", slog.String("error", err.Error()))
	}
	logger.Info("RekaSains Core Control Plane API stopped cleanly")
}
