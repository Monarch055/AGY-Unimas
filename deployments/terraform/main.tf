# Terraform / OpenTofu Infrastructure Definition for RekaSains Cloud & Container Orchestration

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Target environment: production | staging | local"
}

variable "core_api_port" {
  type        = number
  default     = 8080
  description = "Port exposed by Core API Control Plane"
}

variable "ai_agent_port" {
  type        = number
  default     = 8081
  description = "Port exposed by Google ADK AI Agent"
}

variable "web_port" {
  type        = number
  default     = 3000
  description = "Port exposed by Next.js PWA"
}

# Network for RekaSains microservices enclave
resource "docker_network" "rekasains_network" {
  name   = "rekasains-${var.environment}-net"
  driver = "bridge"
}

# Managed PostgreSQL 16 Data Volume
resource "docker_volume" "postgres_data" {
  name = "rekasains-postgres-data-${var.environment}"
}

# Managed Valkey 7.2 Data Volume
resource "docker_volume" "valkey_data" {
  name = "rekasains-valkey-data-${var.environment}"
}

output "network_id" {
  value       = docker_network.rekasains_network.id
  description = "ID of the isolated microservices network"
}
