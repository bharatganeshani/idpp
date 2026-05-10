param(
    [int]$BackendPort = 5000,
    [int]$FrontendPort = 8000
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (Test-Path $venvPython) {
    $python = $venvPython
} else {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCommand) {
        throw "Python was not found. Install Python or create .venv first."
    }
    $python = $pythonCommand.Source
}

function Test-PortListening {
    param([int]$Port)

    try {
        $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
        return $null -ne $listener
    } catch {
        return $false
    }
}

if (Test-PortListening -Port $BackendPort) {
    Write-Host "Backend already running on port $BackendPort"
} else {
    $backendCommand = "& '$python' 'app.py'"
    Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $backendCommand) -WorkingDirectory $backendDir
    Write-Host "Started backend in a new terminal (port $BackendPort)"
}

if (Test-PortListening -Port $FrontendPort) {
    Write-Host "Frontend server already running on port $FrontendPort"
} else {
    $frontendCommand = "& '$python' -m http.server $FrontendPort"
    Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $frontendCommand) -WorkingDirectory $frontendDir
    Write-Host "Started frontend in a new terminal (port $FrontendPort)"
}

Write-Host ""
Write-Host "Backend URL:  http://127.0.0.1:$BackendPort"
Write-Host "Frontend URL: http://127.0.0.1:$FrontendPort"
