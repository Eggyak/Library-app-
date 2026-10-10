param(
    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 65535)]
    [int]$Port
)

$ruleName = 'NU LIRC Server'
$rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($rule) {
    Write-Host '[OK] Firewall rule exists.'
    exit 0
}

try {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $Port `
        -Protocol TCP -Action Allow -Profile Any -RemoteAddress LocalSubnet -ErrorAction Stop |
        Out-Null
    Write-Host '[OK] LAN-only firewall rule created.'
} catch {
    Write-Warning "Could not create firewall rule. For LAN access, run start-server.bat as Administrator. $($_.Exception.Message)"
}
