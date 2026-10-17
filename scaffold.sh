#!/usr/bin/env bash
# ==============================================================================
# Turnkey Scaffolding Generator for AI-Native Monorepos (Bash - Linux/macOS)
# ==============================================================================

set -e

PROJECT_NAME="${1}"
TARGET_DIR="${2}"
DESCRIPTION="${3:-Enterprise AI-Native Monorepo platform}"
FRONTEND_STACK="${4:-Astro v5 + React 19 + Tailwind CSS}"
BACKEND_STACK="${5:-Go 1.25+ / Gin (4-Layer Clean Architecture)}"
BROKER_STACK="${6:-RabbitMQ 3.13 (AMQP 0-9-1)}"
DATABASE_STACK="${7:-PostgreSQL 16 + Valkey / Redis 7.2}"
INFRA_STACK="${8:-Docker Compose + Caddy Reverse Proxy}"
AUTHOR="${9:-Lead AI Engineer}"

CURRENT_DATE=$(date +%Y-%m-%d)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================================"
echo "          🤖 AI-NATIVE MONOREPO SCAFFOLDING GENERATOR                "
echo "======================================================================"

if [ -z "$PROJECT_NAME" ]; then
    read -p "Enter Project Name (e.g. MySaaS): " PROJECT_NAME
    PROJECT_NAME="${PROJECT_NAME:-MyProject}"
fi

if [ -z "$TARGET_DIR" ]; then
    DEFAULT_DIR="../${PROJECT_NAME}"
    read -p "Enter Destination Directory (default: ${DEFAULT_DIR}): " TARGET_DIR
    TARGET_DIR="${TARGET_DIR:-$DEFAULT_DIR}"
fi

PROJECT_NAME_LOWER=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' _' '--')
mkdir -p "$TARGET_DIR"
RESOLVED_TARGET="$(cd "$TARGET_DIR" && pwd)"

echo ""
echo "Target Configuration:"
echo "  Project Name     : $PROJECT_NAME"
echo "  Destination      : $RESOLVED_TARGET"
echo "  Date             : $CURRENT_DATE"
echo ""

# Copy template files excluding generator scripts
find "$SCRIPT_DIR" -mindepth 1 -maxdepth 1 ! -name 'scaffold.ps1' ! -name 'scaffold.sh' -exec cp -r {} "$RESOLVED_TARGET/" \;

echo "[+] Template copied to $RESOLVED_TARGET"

# Replace placeholders across target files using pipe delimiter for safe slash handling
replace_in_file() {
    local target="$1"
    if sed --version 2>/dev/null | grep -q GNU; then
        sed -i \
            -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
            -e "s|{{PROJECT_NAME_LOWER}}|$PROJECT_NAME_LOWER|g" \
            -e "s|{{PROJECT_DESCRIPTION}}|$DESCRIPTION|g" \
            -e "s|{{FRONTEND_STACK}}|$FRONTEND_STACK|g" \
            -e "s|{{BACKEND_STACK}}|$BACKEND_STACK|g" \
            -e "s|{{BROKER_STACK}}|$BROKER_STACK|g" \
            -e "s|{{DATABASE_STACK}}|$DATABASE_STACK|g" \
            -e "s|{{INFRA_STACK}}|$INFRA_STACK|g" \
            -e "s|{{AUTHOR}}|$AUTHOR|g" \
            -e "s|{{DATE}}|$CURRENT_DATE|g" \
            "$target"
    else
        sed -i '' \
            -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
            -e "s|{{PROJECT_NAME_LOWER}}|$PROJECT_NAME_LOWER|g" \
            -e "s|{{PROJECT_DESCRIPTION}}|$DESCRIPTION|g" \
            -e "s|{{FRONTEND_STACK}}|$FRONTEND_STACK|g" \
            -e "s|{{BACKEND_STACK}}|$BACKEND_STACK|g" \
            -e "s|{{BROKER_STACK}}|$BROKER_STACK|g" \
            -e "s|{{DATABASE_STACK}}|$DATABASE_STACK|g" \
            -e "s|{{INFRA_STACK}}|$INFRA_STACK|g" \
            -e "s|{{AUTHOR}}|$AUTHOR|g" \
            -e "s|{{DATE}}|$CURRENT_DATE|g" \
            "$target"
    fi
}

find "$RESOLVED_TARGET" -type f \( \
    -name "*.md" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" \
    -o -name "*.env" -o -name "*.tf" -o -name "*.sh" \
    -o -name "Makefile" -o -name "Caddyfile" -o -name "Dockerfile*" \
    -o -name ".aiignore" -o -name ".cursorrules" -o -name ".gitignore" \
    \) | while read -r file; do
    replace_in_file "$file"
done

echo "[*] Placeholders substituted."

if [ ! -d "$RESOLVED_TARGET/.git" ]; then
    (cd "$RESOLVED_TARGET" && git init -q && echo "[+] Initialized empty Git repository.") || true
fi

echo ""
echo "======================================================================"
echo "       🎉 AI-NATIVE MONOREPO SUCCESSFULLY GENERATED!                 "
echo "======================================================================"
echo "Project Location: $RESOLVED_TARGET"
echo ""
echo "Next steps:"
echo "  1. cd \"$RESOLVED_TARGET\""
echo "  2. cp docs/setup/ENV-VARIABLES.md .env"
echo "  3. make infra-up"
echo "  4. Open in Cursor / IDE"
echo ""
