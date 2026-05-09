param(
    [ValidateSet("build", "check")]
    [string]$Mode = "build",

    [string]$TargetDir = "C:\mwtarget",

    [switch]$NoSync
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ProgramFilesX86 = ${env:ProgramFiles(x86)}

$VcvarsCandidates = @(
    (Join-Path $ProgramFilesX86 "Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"),
    (Join-Path $ProgramFilesX86 "Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"),
    (Join-Path $ProgramFilesX86 "Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat"),
    (Join-Path $ProgramFilesX86 "Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat"),
    (Join-Path $ProgramFilesX86 "Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat")
)

$Vcvars = $VcvarsCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $Vcvars) {
    throw "Could not find Visual Studio Build Tools vcvars64.bat. Install the C++ desktop build tools, then rerun this script."
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

& (Join-Path $PSScriptRoot "setup-onnxruntime-windows.ps1")

if ($Mode -eq "check") {
    $WorkDir = Join-Path $RepoRoot "src-tauri"
    $BuildCommand = "cargo check"
} else {
    $WorkDir = $RepoRoot
    $BuildCommand = "bun run tauri build"
}

$CmdFile = Join-Path $env:TEMP "motsdits-build-$PID.cmd"
$CmdBody = @"
@echo off
call "$Vcvars"
if errorlevel 1 exit /b %errorlevel%
set "CARGO_TARGET_DIR=$TargetDir"
cd /d "$WorkDir"
$BuildCommand
"@

Set-Content -LiteralPath $CmdFile -Value $CmdBody -Encoding ASCII

try {
    Write-Host "Using MSVC environment: $Vcvars"
    Write-Host "Using CARGO_TARGET_DIR: $TargetDir"
    Write-Host "Running: $BuildCommand"
    & cmd.exe /d /c $CmdFile
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Remove-Item -LiteralPath $CmdFile -Force -ErrorAction SilentlyContinue
}

if ($Mode -eq "build" -and -not $NoSync) {
    $ReleaseSource = Join-Path $TargetDir "release"
    $ReleaseDest = Join-Path $RepoRoot "src-tauri\target\release"

    New-Item -ItemType Directory -Force -Path $ReleaseDest | Out-Null

    function Copy-BuildArtifact {
        param(
            [string]$Source,
            [string]$Destination,
            [switch]$Recurse
        )

        try {
            Copy-Item -LiteralPath $Source -Destination $Destination -Force -Recurse:$Recurse
            return $true
        }
        catch {
            Write-Warning "Could not sync '$Source' to '$Destination': $($_.Exception.Message)"
            return $false
        }
    }

    $ExeSource = Join-Path $ReleaseSource "motsdits.exe"
    if (Test-Path -LiteralPath $ExeSource) {
        if (Copy-BuildArtifact -Source $ExeSource -Destination (Join-Path $ReleaseDest "motsdits.exe")) {
            Write-Host "Synced motsdits.exe to src-tauri\target\release"
        }
    }

    $ResourcesSource = Join-Path $RepoRoot "src-tauri\resources"
    $ResourcesDest = Join-Path $ReleaseDest "resources"
    if (Test-Path -LiteralPath $ResourcesSource) {
        New-Item -ItemType Directory -Force -Path $ResourcesDest | Out-Null
        Copy-Item -Path (Join-Path $ResourcesSource "*") -Destination $ResourcesDest -Force -Recurse
        Write-Host "Synced resources to src-tauri\target\release\resources"
    }

    $BundleSource = Join-Path $ReleaseSource "bundle"
    $BundleDest = Join-Path $ReleaseDest "bundle"
    foreach ($Subdir in @("msi", "nsis")) {
        $SourceSubdir = Join-Path $BundleSource $Subdir
        if (Test-Path -LiteralPath $SourceSubdir) {
            $DestSubdir = Join-Path $BundleDest $Subdir
            New-Item -ItemType Directory -Force -Path $DestSubdir | Out-Null
            $Artifacts = Get-ChildItem -LiteralPath $SourceSubdir -Force
            foreach ($Artifact in $Artifacts) {
                Copy-BuildArtifact -Source $Artifact.FullName -Destination $DestSubdir -Recurse | Out-Null
            }
            Write-Host "Synced $Subdir bundle to src-tauri\target\release\bundle\$Subdir"
        }
    }
}
