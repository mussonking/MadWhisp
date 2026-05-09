param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$TauriArgs
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$TargetDir = Join-Path $env:SystemDrive "mw-target"
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

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
    throw "Could not find Visual Studio vcvars64.bat. Install Visual Studio C++ build tools."
}

$cmakeCandidates = @(
    (Join-Path ${env:ProgramFiles} "CMake\bin\cmake.exe"),
    (Join-Path ${env:ProgramFiles} "Microsoft Visual Studio\2022\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"),
    (Join-Path ${env:ProgramFiles} "Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"),
    "C:\Users\Musson\AppData\Roaming\Python\Python314\Scripts\cmake.exe",
    "C:\Users\Musson\AppData\Local\Programs\Python\Python314\Scripts\cmake.exe"
)

$cmakePath = $cmakeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $cmakePath) {
    throw "No CMake executable found. Install CMake or a Visual Studio workload with CMake support."
}

$argLine = if ($TauriArgs.Count -gt 0) {
    $TauriArgs | ForEach-Object {
        if ($_ -match '[" ]') { '"{0}"' -f ($_ -replace '"', '\"') } else { $_ }
    }
}
else {
    @("dev")
}

$cmdFile = Join-Path $env:TEMP "motsdits-tauri-cmd-$PID.cmd"
$cmdBody = @"
@echo off
call "$Vcvars"
if errorlevel 1 exit /b %errorlevel%
for /f "delims=" %%i in ('where.exe cl 2^>nul') do (
    if not defined CL_PATH set "CL_PATH=%%i"
)
if not defined CL_PATH (
    echo [tauri-windows] Could not resolve cl.exe after loading Visual Studio environment.
    exit /b 1
)
set "CC=%CL_PATH%"
set "CXX=%CL_PATH%"
set "CMAKE_C_COMPILER=%CL_PATH%"
set "CMAKE_CXX_COMPILER=%CL_PATH%"
set "CMAKE=$cmakePath"
set "CARGO_TARGET_DIR=$TargetDir"
cd /d "$RepoRoot"
bunx tauri $($argLine -join ' ')
if errorlevel 1 exit /b %errorlevel%
"@

Set-Content -LiteralPath $cmdFile -Value $cmdBody -Encoding ASCII
try {
    & cmd.exe /d /c $cmdFile
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Remove-Item -LiteralPath $cmdFile -Force -ErrorAction SilentlyContinue
}
