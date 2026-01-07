# Script para configurar variables de entorno de AWS en Windows
# ⚠️ SOLO PARA DESARROLLO LOCAL ⚠️

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Configurar Variables de Entorno AWS" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script configurará las variables de entorno para desarrollo local sin pedirlas una por una." -ForegroundColor Yellow
Write-Host "Busca los valores en la sesión actual o en archivos .env/.env.local y los guarda como variables de USUARIO." -ForegroundColor Yellow
Write-Host ""

function Cargar-DotEnv([string]$ruta) {
    $diccionario = @{}
    if (Test-Path $ruta) {
        Get-Content $ruta | ForEach-Object {
            $linea = $_.Trim()
            if (-not [string]::IsNullOrWhiteSpace($linea) -and -not $linea.StartsWith("#") -and $linea.Contains("=")) {
                $parts = $linea.Split("=", 2)
                $clave = $parts[0].Trim()
                $valor = $parts[1].Trim().Trim("'`"")
                $diccionario[$clave] = $valor
            }
        }
    }
    return $diccionario
}

function Obtener-Valor([string]$clave, $fallbacks) {
    $valorEnv = [System.Environment]::GetEnvironmentVariable($clave, "Process")
    if (-not $valorEnv) { $valorEnv = [System.Environment]::GetEnvironmentVariable($clave, "User") }
    if (-not $valorEnv) { $valorEnv = [System.Environment]::GetEnvironmentVariable($clave, "Machine") }

    if ($valorEnv) {
        return $valorEnv
    }

    foreach ($map in $fallbacks) {
        if ($map.ContainsKey($clave)) {
            return $map[$clave]
        }
    }
    return $null
}

function EsPlaceholder([string]$valor) {
    if (-not $valor) { return $false }
    $normalized = $valor.Trim().ToUpper()
    return $normalized -like "<*>" -or $normalized -like "*YOUR-AKID*" -or $normalized -like "*YOUR-SECRET*"
}

try {
    $root = Split-Path -Parent $MyInvocation.MyCommand.Path
    $dotenvLocal = Cargar-DotEnv (Join-Path $root ".env.local")
    $dotenv = Cargar-DotEnv (Join-Path $root ".env")
    $fallbacks = @($dotenvLocal, $dotenv)

    $accessKey = Obtener-Valor "AWS_ACCESS_KEY_ID" $fallbacks
    $secretKey = Obtener-Valor "AWS_SECRET_ACCESS_KEY" $fallbacks
    $sessionToken = Obtener-Valor "AWS_SESSION_TOKEN" $fallbacks
    $region = Obtener-Valor "AWS_REGION" $fallbacks
    if (-not $region) { $region = "sa-east-1" }

    $cognitoPool = Obtener-Valor "COGNITO_USER_POOL_ID" $fallbacks
    $cognitoClient = Obtener-Valor "COGNITO_CLIENT_ID" $fallbacks

    if (-not $accessKey -or -not $secretKey) {
        throw "No se encontraron AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY en el entorno ni en .env/.env.local."
    }

    if (EsPlaceholder($accessKey) -or EsPlaceholder($secretKey)) {
        throw "Las credenciales encontradas parecen placeholders (por ejemplo, <YOUR-AKID>). Reemplazalas en .env/.env.local con valores reales antes de ejecutar el script."
    }

    [System.Environment]::SetEnvironmentVariable("AWS_ACCESS_KEY_ID", $accessKey, "User")
    [System.Environment]::SetEnvironmentVariable("AWS_SECRET_ACCESS_KEY", $secretKey, "User")
    [System.Environment]::SetEnvironmentVariable("AWS_SESSION_TOKEN", $sessionToken, "User")
    [System.Environment]::SetEnvironmentVariable("AWS_REGION", $region, "User")

    if ($cognitoPool) {
        [System.Environment]::SetEnvironmentVariable("COGNITO_USER_POOL_ID", $cognitoPool, "User")
    }
    if ($cognitoClient) {
        [System.Environment]::SetEnvironmentVariable("COGNITO_CLIENT_ID", $cognitoClient, "User")
    }

    Write-Host ""
    Write-Host "✅ Variables de entorno configuradas correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Variables configuradas:" -ForegroundColor Cyan
    Write-Host "  - AWS_ACCESS_KEY_ID" -ForegroundColor White
    Write-Host "  - AWS_SECRET_ACCESS_KEY" -ForegroundColor White
    if ($sessionToken) {
        Write-Host "  - AWS_SESSION_TOKEN" -ForegroundColor White
    }
    Write-Host "  - AWS_REGION ($region)" -ForegroundColor White
    if ($cognitoPool) {
        Write-Host "  - COGNITO_USER_POOL_ID" -ForegroundColor White
    }
    if ($cognitoClient) {
        Write-Host "  - COGNITO_CLIENT_ID" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Cerrá y volvé a abrir la terminal/IDE para que tome las variables." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para verificar en una NUEVA terminal:" -ForegroundColor Cyan
    Write-Host '  echo $env:AWS_ACCESS_KEY_ID' -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Error al configurar variables: $_" -ForegroundColor Red
    Write-Host "Revisá que las variables existan en el entorno o en los archivos .env/.env.local." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Presioná Enter para salir..."
Read-Host

