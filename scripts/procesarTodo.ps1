<#
.SYNOPSIS
    Procesamiento automatizado de programas electorales (PDF -> Markdown, JSON, TXT).
.DESCRIPTION
    Escanea la carpeta 'pdfs_originales', detecta documentos pendientes y los convierte
    a formatos estándar de IA (Markdown, JSON, TXT) en la carpeta 'procesados'.
    Utiliza el script convertir_docling.py con backend PyPdfium para máxima estabilidad.
#>

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$Raiz = (Get-Item $PSScriptRoot).Parent.FullName
$CarpetaPDFs = Join-Path $Raiz "pdfs_originales"
$CarpetaProcesados = Join-Path $Raiz "procesados"
$CarpetaLogs = Join-Path $Raiz "logs"
$ScriptDocling = Join-Path $PSScriptRoot "convertir_docling.py"

New-Item -ItemType Directory -Force -Path $CarpetaPDFs, $CarpetaProcesados, $CarpetaLogs | Out-Null

$PDFs = @(Get-ChildItem -LiteralPath $CarpetaPDFs -File -Filter "*.pdf")

if ($PDFs.Count -eq 0) {
    Write-Host "No se encontraron PDFs en $CarpetaPDFs" -ForegroundColor Yellow
    exit 0
}

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "    PROCESAMIENTO DE PROGRAMAS ELECTORALES 29N       " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Total PDFs encontrados: $($PDFs.Count)"
Write-Host ""

$Correctos = 0
$Omitidos = 0
$Fallidos = 0

foreach ($PDF in $PDFs) {
    $NombreBase = [IO.Path]::GetFileNameWithoutExtension($PDF.Name)
    $Destino = Join-Path $CarpetaProcesados $NombreBase
    
    $MD = Join-Path $Destino "$NombreBase.md"
    $JSON = Join-Path $Destino "$NombreBase.json"
    $TXT = Join-Path $Destino "$NombreBase.txt"
    $Meta = Join-Path $Destino "metadata.json"

    $YaProcesado = (Test-Path $MD) -and (Test-Path $JSON) -and (Test-Path $TXT) -and (Test-Path $Meta)
    
    if ($YaProcesado -and !$Force) {
        Write-Host "[OMITIDO] $NombreBase ya está completamente procesado." -ForegroundColor DarkGray
        $Omitidos++
        continue
    }

    Write-Host "[PROCESANDO] $NombreBase..." -ForegroundColor Cyan
    $Argumentos = @(
        $ScriptDocling,
        $PDF.FullName,
        $Destino,
        $NombreBase
    )
    if ($Force) { $Argumentos += "--force" }

    $Proceso = Start-Process -FilePath "python" -ArgumentList $Argumentos -Wait -PassThru -NoNewWindow

    if ($Proceso.ExitCode -eq 0) {
        Write-Host "[COMPLETADO] $NombreBase procesado con éxito." -ForegroundColor Green
        $Correctos++
    }
    else {
        Write-Host "[ERROR] Falló la conversión de $NombreBase (código: $($Proceso.ExitCode))." -ForegroundColor Red
        $Fallidos++
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "RESUMEN:" -ForegroundColor Cyan
Write-Host "  Completados: $Correctos" -ForegroundColor Green
Write-Host "  Omitidos:    $Omitidos" -ForegroundColor DarkGray
Write-Host "  Fallidos:    $Fallidos" -ForegroundColor $(if ($Fallidos -gt 0) {"Red"} else {"Green"})
Write-Host "=====================================================" -ForegroundColor Cyan
