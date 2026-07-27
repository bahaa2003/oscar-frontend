param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('assembleDebug', 'bundleRelease')]
  [string]$Task
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidStudioJdk = 'C:\Program Files\Android\Android Studio\jbr'
$androidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'

if (-not (Test-Path (Join-Path $androidStudioJdk 'bin\java.exe'))) {
  throw "Android Studio JDK was not found at $androidStudioJdk."
}

if (-not (Test-Path $androidSdk)) {
  throw "Android SDK was not found at $androidSdk."
}

$env:JAVA_HOME = $androidStudioJdk
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:Path = "$androidStudioJdk\bin;$androidSdk\platform-tools;$env:Path"

Push-Location $projectRoot
try {
  npm run sync:android
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Push-Location 'android'
  try {
    & .\gradlew.bat --no-daemon --console=plain $Task
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
  finally {
    Pop-Location
  }
}
finally {
  Pop-Location
}
