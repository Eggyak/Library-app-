$ErrorActionPreference = 'Stop'

$configurationPath = Join-Path $PSScriptRoot '..\.env'
$script:configurationLines = [System.Collections.Generic.List[string]]::new()
if (Test-Path -LiteralPath $configurationPath) {
  foreach ($line in [System.IO.File]::ReadAllLines($configurationPath)) {
    $script:configurationLines.Add($line)
  }
}

function Get-ConfigurationValue([string]$key) {
  $pattern = '^\s*' + [regex]::Escape($key) + '\s*=\s*(.*)$'
  foreach ($line in $script:configurationLines) {
    if ($line -match $pattern) {
      $value = $Matches[1].Trim()
      if ($value.StartsWith('"')) {
        try { return ($value | ConvertFrom-Json -ErrorAction Stop) } catch { return '' }
      }
      if ($value.StartsWith("'")) { return $value.Trim("'") }
      return $value
    }
  }
  return ''
}

function Set-ConfigurationValue([string]$key, [string]$value, [switch]$quoted) {
  $formatted = $value
  if ($quoted) {
    $escaped = $value.Replace('\', '\\').Replace('"', '\"').Replace("`r", '\r').Replace("`n", '\n')
    $formatted = '"' + $escaped + '"'
  }

  $pattern = '^\s*' + [regex]::Escape($key) + '\s*='
  for ($index = 0; $index -lt $script:configurationLines.Count; $index++) {
    if ($script:configurationLines[$index] -match $pattern) {
      $script:configurationLines[$index] = "$key=$formatted"
      return
    }
  }
  $script:configurationLines.Add("$key=$formatted")
}

function Convert-SecureStringToPlainText([Security.SecureString]$value) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

try {
  $authDisabled = (Get-ConfigurationValue 'AUTH_DISABLED').Trim().ToLowerInvariant()
  if (-not $authDisabled) {
    $authDisabled = 'false'
    Set-ConfigurationValue 'AUTH_DISABLED' $authDisabled
  }
  if ($authDisabled -notin @('true', 'false')) { throw 'AUTH_DISABLED must be true or false.' }

  if ($authDisabled -eq 'false') {
  $adminLoginId = (Get-ConfigurationValue 'SUPER_ADMIN_LOGIN_ID').Trim()
  if (-not $adminLoginId) {
    $adminLoginId = (Read-Host 'Super Admin Login ID (for example superadmin)').Trim()
    if ($adminLoginId -notmatch '^[A-Za-z0-9._@+-]{3,120}$') { throw 'Login ID must be 3 to 120 letters, digits, dots, underscores, @ or hyphens.' }
    Set-ConfigurationValue 'SUPER_ADMIN_LOGIN_ID' $adminLoginId
  }

  $adminPassword = Get-ConfigurationValue 'SUPER_ADMIN_PASSWORD'
  if ($adminPassword.Length -lt 12) {
    do {
      $securePassword = Read-Host 'Initial Super Admin password (12+ characters; input hidden)' -AsSecureString
      $secureConfirmation = Read-Host 'Confirm initial password (input hidden)' -AsSecureString
      $adminPassword = Convert-SecureStringToPlainText $securePassword
      $confirmation = Convert-SecureStringToPlainText $secureConfirmation
      if ($adminPassword.Length -lt 12 -or $adminPassword -cne $confirmation) {
        Write-Host 'Passwords must match and be at least 12 characters.' -ForegroundColor Yellow
        $adminPassword = ''
      }
      $confirmation = ''
    } while ($adminPassword.Length -lt 12)
  }
  Set-ConfigurationValue 'SUPER_ADMIN_PASSWORD' $adminPassword -quoted
  $adminPassword = ''
  }

  $jwtSecret = Get-ConfigurationValue 'JWT_SECRET'
  if ($jwtSecret.Length -lt 32 -or $jwtSecret.ToLowerInvariant().StartsWith('replace-') -or $jwtSecret -match '\s|#') {
    $randomBytes = New-Object byte[] 48
    $randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $randomGenerator.GetBytes($randomBytes) } finally { $randomGenerator.Dispose() }
    $jwtSecret = [Convert]::ToBase64String($randomBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    Set-ConfigurationValue 'JWT_SECRET' $jwtSecret
  }

  Set-Content -LiteralPath $configurationPath -Value $script:configurationLines -Encoding UTF8
  if ($authDisabled -eq 'true') {
    Write-Host 'Local development mode is enabled; authentication is bypassed and access is restricted to this PC.' -ForegroundColor Yellow
  } else {
    Write-Host 'Server configuration is ready. The initial Super Admin password was not displayed.' -ForegroundColor Green
  }
} catch {
  Write-Host 'Could not prepare server/.env. Check file permissions and try again.' -ForegroundColor Red
  exit 1
}
