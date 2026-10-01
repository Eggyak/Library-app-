$ErrorActionPreference = 'Stop'

$workspacePath = Split-Path -Parent $PSScriptRoot
$appPath = Join-Path $workspacePath 'nu-library-app'
$setupPath = Join-Path $env:LOCALAPPDATA 'NU-LIRC-Android-Build'
$jdkPath = Join-Path $setupPath 'jdk\jdk-21.0.12.1+1'
$sdkPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$sdkManager = Join-Path $sdkPath 'cmdline-tools\latest\bin\sdkmanager.bat'

if (-not (Test-Path -LiteralPath $sdkManager)) {
  throw "Android SDK command-line tools not found: $sdkManager"
}

$env:JAVA_HOME = $jdkPath
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:PATH = "$jdkPath\bin;$sdkPath\platform-tools;$sdkPath\cmdline-tools\latest\bin;$env:PATH"

& $sdkManager --sdk_root=$sdkPath 'platform-tools' 'platforms;android-35' 'platforms;android-36' 'build-tools;35.0.0' 'build-tools;36.0.0'
if ($LASTEXITCODE -ne 0) { throw 'Android SDK package installation failed.' }

Push-Location $appPath
try {
  npm.cmd install @capacitor/core @capacitor/cli @capacitor/android
  if ($LASTEXITCODE -ne 0) { throw 'Capacitor package installation failed.' }

  npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Web application build failed.' }

  if (-not (Test-Path -LiteralPath (Join-Path $appPath 'android'))) {
    npx.cmd cap add android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor Android project creation failed.' }
  }

  npx.cmd cap sync android
  if ($LASTEXITCODE -ne 0) { throw 'Capacitor Android sync failed.' }

  $gradleLog = Join-Path $setupPath 'gradle-build.log'
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  Push-Location (Join-Path $appPath 'android')
  & '.\gradlew.bat' --stop | Out-Null
  & '.\gradlew.bat' --no-daemon -Dorg.gradle.jvmargs='-Xmx1024m -Dfile.encoding=UTF-8' assembleDebug --stacktrace --console=plain *> $gradleLog
  Pop-Location
  $gradleExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  Get-Content -LiteralPath $gradleLog -Tail 100
  if ($gradleExitCode -ne 0) { throw "Gradle debug APK build failed with exit code $gradleExitCode. Full log: $gradleLog" }
}
finally {
  Pop-Location
}

$apkPath = Join-Path $appPath 'android\app\build\outputs\apk\debug\app-debug.apk'
$sharePath = Join-Path $workspacePath 'APKs for Testing'
New-Item -ItemType Directory -Force -Path $sharePath | Out-Null
$outputPath = Join-Path $sharePath 'NU-LIRC-updated-debug.apk'
Copy-Item -LiteralPath $apkPath -Destination $outputPath -Force
Write-Output "Updated APK: $outputPath"