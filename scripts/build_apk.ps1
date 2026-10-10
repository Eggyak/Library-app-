# NU LIRC APK Build Script
# Builds the Android APK for the student app
param(
    [string]$OutputPath = "$env:USERPROFILE\dist\library-app.apk"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================="
Write-Host "  NU LIRC - Android APK Build"
Write-Host "=================================================="
Write-Host ""

# Set working directories
$AppDir = "D:\Niit University Library app\nu-library-app"
$AndroidDir = "$AppDir\android"

# Detect JAVA_HOME
$javaHome = $env:JAVA_HOME
if ($javaHome) {
    $configuredJavaVersion = & (Join-Path $javaHome 'bin\java.exe') -version 2>&1 | Out-String
    if ($configuredJavaVersion -notmatch 'version "21(?:\.|"|-)' -and $configuredJavaVersion -notmatch 'openjdk 21') {
        Write-Host '[WARN] JAVA_HOME does not point to JDK 21; checking the bundled JDK.'
        $javaHome = $null
    }
}
if (-not $javaHome) {
    # Try common locations
    $possiblePaths = @(
        "$env:LOCALAPPDATA\NU-LIRC-Android-Build\jdk\jdk-21.0.12.1+1",
        "C:\Program Files\Java\jdk-21"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $javaHome = $path
            break
        }
    }
}

if (-not $javaHome) {
    Write-Host "[ERROR] JDK 21 not found."
    Write-Host "Install JDK 21 or set JAVA_HOME to a JDK 21 installation."
    Write-Host "Download from: https://adoptium.net/"
    exit 1
}

$javaVersionOutput = & (Join-Path $javaHome 'bin\java.exe') -version 2>&1 | Out-String
if ($javaVersionOutput -notmatch 'version "21(?:\.|"|-)' -and $javaVersionOutput -notmatch 'openjdk 21') {
    Write-Host "[ERROR] Android build requires JDK 21. Detected: $($javaVersionOutput.Trim())"
    exit 1
}

$env:JAVA_HOME = $javaHome
Write-Host "[OK] JAVA_HOME: $javaHome"

# Detect Android SDK
$androidSdk = $env:ANDROID_HOME
if (-not $androidSdk) {
    $androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
}

if (-not (Test-Path $androidSdk)) {
    Write-Host "[ERROR] Android SDK not found."
    Write-Host "Please install Android Studio and set ANDROID_HOME."
    exit 1
}

$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
Write-Host "[OK] Android SDK: $androidSdk"

# Build web assets
Write-Host ""
Write-Host "[INFO] Building web assets..."
Push-Location $AppDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build exited with code $LASTEXITCODE" }
}
catch {
    Write-Host "[ERROR] Web build failed."
    exit 1
}
finally {
    Pop-Location
}

# Sync Capacitor
Write-Host ""
Write-Host "[INFO] Syncing with Capacitor..."
Push-Location $AppDir
try {
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "Capacitor sync exited with code $LASTEXITCODE" }
}
catch {
    Write-Host "[ERROR] Capacitor sync failed."
    exit 1
}
finally {
    Pop-Location
}

# Build APK
Write-Host ""
Write-Host "[INFO] Building APK with Gradle..."
Push-Location $AndroidDir
try {
    $env:JAVA_HOME = $javaHome
    $env:ANDROID_HOME = $androidSdk
    $env:ANDROID_SDK_ROOT = $androidSdk
    & .\gradlew.bat assembleDebug --no-daemon
    if ($LASTEXITCODE -ne 0) { throw "Gradle exited with code $LASTEXITCODE" }
}
catch {
    Write-Host "[ERROR] Gradle build failed."
    exit 1
}
finally {
    Pop-Location
}

# Copy APK to output location
$apkPath = "$AndroidDir\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $outputDir = Split-Path $OutputPath -Parent
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    Copy-Item $apkPath $OutputPath -Force
    Write-Host ""
    Write-Host "[SUCCESS] APK built successfully!"
    Write-Host "  Location: $OutputPath"
    Write-Host ""
    Write-Host "To install on device:"
    Write-Host "  adb install -r `"$OutputPath`""
} else {
    Write-Host "[ERROR] APK not found at expected location."
    exit 1
}

Write-Host ""
Write-Host "=================================================="
