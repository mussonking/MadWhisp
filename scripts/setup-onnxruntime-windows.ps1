param(
    [string]$OnnxRuntimeVersion = "1.24.2",
    [string]$DirectMLVersion = "1.15.4",
    [ValidateSet("x64", "arm64")]
    [string]$Arch = "x64",
    [string]$Destination,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$UsingDefaultDestination = -not $Destination
if (-not $Destination) {
    $Destination = Join-Path $RepoRoot "src-tauri\resources\onnxruntime\windows-$Arch"
}

$CacheRoot = Join-Path $env:LOCALAPPDATA "MotsDits\build-cache\nuget"
New-Item -ItemType Directory -Force -Path $CacheRoot | Out-Null
if ($UsingDefaultDestination) {
    $OnnxResourceRoot = Join-Path $RepoRoot "src-tauri\resources\onnxruntime"
    if (Test-Path -LiteralPath $OnnxResourceRoot) {
        Get-ChildItem -LiteralPath $OnnxResourceRoot -Directory -Filter "windows-*" |
            Where-Object { $_.Name -ne "windows-$Arch" } |
            Remove-Item -Recurse -Force
    }
}
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

function Expand-NuGetPackage {
    param(
        [string]$PackageId,
        [string]$Version
    )

    $PackageIdLower = $PackageId.ToLowerInvariant()
    $PackageDir = Join-Path $CacheRoot "$PackageIdLower.$Version"
    $Nupkg = Join-Path $CacheRoot "$PackageIdLower.$Version.nupkg"
    $Zip = Join-Path $CacheRoot "$PackageIdLower.$Version.zip"

    if ($Force -or -not (Test-Path -LiteralPath $Nupkg)) {
        $Url = "https://api.nuget.org/v3-flatcontainer/$PackageIdLower/$Version/$PackageIdLower.$Version.nupkg"
        Write-Host "Downloading $PackageId $Version"
        Invoke-WebRequest $Url -OutFile $Nupkg
    }

    if ($Force -or -not (Test-Path -LiteralPath $PackageDir)) {
        if (Test-Path -LiteralPath $PackageDir) {
            Remove-Item -LiteralPath $PackageDir -Recurse -Force
        }
        Copy-Item -LiteralPath $Nupkg -Destination $Zip -Force
        Expand-Archive -LiteralPath $Zip -DestinationPath $PackageDir -Force
    }

    return $PackageDir
}

$OnnxPackage = Expand-NuGetPackage -PackageId "Microsoft.ML.OnnxRuntime.DirectML" -Version $OnnxRuntimeVersion
$DirectMLPackage = Expand-NuGetPackage -PackageId "Microsoft.AI.DirectML" -Version $DirectMLVersion

$OnnxRuntimeRid = if ($Arch -eq "arm64") { "win-arm64" } else { "win-x64" }
$DirectMLRid = if ($Arch -eq "arm64") { "arm64-win" } else { "x64-win" }

$Files = @(
    @{
        Source = Join-Path $OnnxPackage "runtimes\$OnnxRuntimeRid\native\onnxruntime.dll"
        Name = "onnxruntime.dll"
    },
    @{
        Source = Join-Path $OnnxPackage "runtimes\$OnnxRuntimeRid\native\onnxruntime_providers_shared.dll"
        Name = "onnxruntime_providers_shared.dll"
    },
    @{
        Source = Join-Path $DirectMLPackage "bin\$DirectMLRid\DirectML.dll"
        Name = "DirectML.dll"
    }
)

foreach ($File in $Files) {
    if (-not (Test-Path -LiteralPath $File.Source)) {
        throw "Missing ONNX Runtime dependency: $($File.Source)"
    }

    $Target = Join-Path $Destination $File.Name
    Copy-Item -LiteralPath $File.Source -Destination $Target -Force
}

Write-Host "ONNX Runtime Windows dependencies are ready in $Destination"
