# Multi-Stage Isolated Build for services/core-api (Go 1.23+)
FROM golang:1.23-alpine AS builder

WORKDIR /build
COPY go.mod ./
COPY cmd/ ./cmd/
COPY internal/ ./internal/

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /build/rekasains-core-api ./cmd/api

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata curl && adduser -D -u 10001 appuser
WORKDIR /app
COPY --from=builder /build/rekasains-core-api /app/rekasains-core-api
COPY migrations/ /app/migrations/

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/v1/health || exit 1

ENTRYPOINT ["/app/rekasains-core-api"]
