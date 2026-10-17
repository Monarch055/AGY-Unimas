<#
.SYNOPSIS
    Turnkey Scaffolding Generator for AI-Native Monorepos (Windows PowerShell)
.DESCRIPTION
    Scaffolds a clean, disciplined, AI-Native Monorepo project from this template.
.EXAMPLE
    .\scaffold.ps1 -ProjectName "NovaCloud" -TargetDir "D:\Projects\NovaCloud"
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$ProjectName,

    [Parameter(Position = 1)]
    [string]$TargetDir,

    [Parameter()]
    [string]$Description = "Enterprise AI-Native Monorepo platform",

    [Parameter()]
    [string]$FrontendStack = "Astro v5 + React 19 + Tailwind CSS",

    [Parameter()]
    [string]$BackendStack = "Go 1.25+ / Gin (4-Layer Clean Architecture)",

    [Parameter()]
    [string]$BrokerStack = "RabbitMQ 3.13 (AMQP 0-9-1)",

    [Parameter()]
    [string]$DatabaseStack = "PostgreSQL 16 + Valkey / Redis 7.2",

    [Parameter()]
    [string]$InfraStack = "Docker Compose + Caddy Reverse Proxy",

    [Parameter()]
    [string]$Author = "Lead AI Engineer"
)

$ErrorActionPreference = "Stop"

Clear-Host
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          🤖 AI-NATIVE MONOREPO SCAFFOLDING GENERATOR                " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# Interactive prompt if ProjectName is not passed
if (-not $ProjectName) {
    $ProjectName = Read-Host "Enter Project Name (e.g. MySaaS)"
    if (-not $ProjectName) {
        $ProjectName = "MyProject"
    }
}

if (-not $TargetDir) {
    $defaultDir = "..\$ProjectName"
    $inputDir = Read-Host "Enter Destination Directory (default: $defaultDir)"
    if ($inputDir) {
        $TargetDir = $inputDir
    } else {
        $TargetDir = $defaultDir
    }
}

# Resolve target path (supporting both absolute and relative paths)
$sourceDir = $PSScriptRoot
if ([System.IO.Path]::IsPathRooted($TargetDir)) {
    $resolvedTarget = [System.IO.Path]::GetFullPath($TargetDir)
} else {
    $resolvedTarget = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $TargetDir))
}
$ProjectNameLower = $ProjectName.ToLower().Replace(" ", "-").Replace("_", "-")
$currentDate = (Get-Date).ToString("yyyy-MM-dd")

Write-Host "`nTarget Configuration:" -ForegroundColor Yellow
Write-Host "  Project Name     : $ProjectName"
Write-Host "  Destination      : $resolvedTarget"
Write-Host "  Frontend Stack   : $FrontendStack"
Write-Host "  Backend Stack    : $BackendStack"
Write-Host "  Database Stack   : $DatabaseStack"
Write-Host "  Author           : $Author"
Write-Host "  Date             : $currentDate`n"

# Create destination directory
if (-not (Test-Path $resolvedTarget)) {
    New-Item -ItemType Directory -Path $resolvedTarget -Force | Out-Null
    Write-Host "[+] Created target directory: $resolvedTarget" -ForegroundColor Green
} else {
    Write-Host "[!] Target directory exists. Merging template..." -ForegroundColor Yellow
}

# Copy all template files except the scaffolding scripts themselves
$excludeItems = @("scaffold.ps1", "scaffold.sh")

Get-ChildItem -Path $sourceDir -Recurse | ForEach-Object {
    $relative = $_.FullName.Substring($sourceDir.Length).TrimStart("\", "/")
    
    # Check if relative path starts with any excluded file
    $shouldExclude = $false
    foreach ($ex in $excludeItems) {
        if ($relative -eq $ex) {
            $shouldExclude = $true
            break
        }
    }

    if (-not $shouldExclude) {
        $destPath = Join-Path $resolvedTarget $relative
        if ($_.PSIsContainer) {
            if (-not (Test-Path $destPath)) {
                New-Item -ItemType Directory -Path $destPath -Force | Out-Null
            }
        } else {
            Copy-Item -Path $_.FullName -Destination $destPath -Force
        }
    }
}

Write-Host "[+] Template structure copied." -ForegroundColor Green

# Replace placeholders across text files
$extensionsToReplace = @("*.md", "*.yaml", "*.yml", "*.json", "*.env", "*.txt", "*.tf", "*.sh", "Makefile", "Caddyfile", "Dockerfile*", ".aiignore", ".cursorrules", ".gitignore")
$filesToReplace = Get-ChildItem -Path $resolvedTarget -Recurse -File | Where-Object {
    $name = $_.Name
    $matched = $false
    foreach ($pattern in $extensionsToReplace) {
        if ($name -like $pattern) {
            $matched = $true
            break
        }
    }
    return $matched
}

Write-Host "[*] Substituting template variables in $($filesToReplace.Count) files..." -ForegroundColor Cyan

foreach ($file in $filesToReplace) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $newContent = $content.Replace("{{PROJECT_NAME}}", $ProjectName)
        $newContent = $newContent.Replace("{{PROJECT_NAME_LOWER}}", $ProjectNameLower)
        $newContent = $newContent.Replace("{{PROJECT_DESCRIPTION}}", $Description)
        $newContent = $newContent.Replace("{{FRONTEND_STACK}}", $FrontendStack)
        $newContent = $newContent.Replace("{{BACKEND_STACK}}", $BackendStack)
        $newContent = $newContent.Replace("{{BROKER_STACK}}", $BrokerStack)
        $newContent = $newContent.Replace("{{DATABASE_STACK}}", $DatabaseStack)
        $newContent = $newContent.Replace("{{INFRA_STACK}}", $InfraStack)
        $newContent = $newContent.Replace("{{AUTHOR}}", $Author)
        $newContent = $newContent.Replace("{{DATE}}", $currentDate)
        
        if ($newContent -ne $content) {
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        }
    } catch {
        Write-Warning "Could not process file $($file.FullName): $_"
    }
}

# Initialize git if not already initialized
if (-not (Test-Path (Join-Path $resolvedTarget ".git"))) {
    try {
        Push-Location $resolvedTarget
        git init -q
        Pop-Location
        Write-Host "[+] Initialized empty Git repository." -ForegroundColor Green
    } catch {
        Write-Host "[-] Git command not found or failed; skipping git init." -ForegroundColor Yellow
    }
}

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "       🎉 AI-NATIVE MONOREPO SUCCESSFULLY GENERATED!                 " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Project Location: $resolvedTarget`n" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd `"$resolvedTarget`""
Write-Host "  2. cp docs/setup/ENV-VARIABLES.md .env"
Write-Host "  3. make infra-up  # Start Postgres, Valkey, RabbitMQ"
Write-Host "  4. Open project in Cursor, Windsurf, or Antigravity"
Write-Host "  5. Enjoy 100% disciplined, hallucination-free AI pairing!`n"
