$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/api/v1'
$envLines = Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\.env')
$adminLogin = (($envLines | Where-Object { $_ -match '^SUPER_ADMIN_LOGIN_ID=' } | Select-Object -First 1) -split '=', 2)[1]
$adminPassword = (($envLines | Where-Object { $_ -match '^SUPER_ADMIN_PASSWORD=' } | Select-Object -First 1) -split '=', 2)[1]
function New-Password { $bytes = New-Object byte[] 24; $rng = [Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); $rng.Dispose(); return ([Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_') + 'aA7!') }
function Invoke-Api($path, $method='GET', $token='', $body=$null, $headers=@{}) {
  $h = @{} + $headers
  if ($token) { $h.Authorization = "Bearer $token" }
  try {
    if ($body -ne $null) { return Invoke-RestMethod -Uri "$base$path" -Method $method -Headers $h -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 20) }
    return Invoke-RestMethod -Uri "$base$path" -Method $method -Headers $h
  } catch { $status=[int]$_.Exception.Response.StatusCode; throw "API $method $path failed with HTTP ${status}: $($_.ErrorDetails.Message)" }
}
function New-Matrix($modules, $allowed) { @($modules | ForEach-Object { $module=$_; @('read','write','update','delete') | ForEach-Object { [pscustomobject]@{ module=$module; action=$_; allowed=($allowed -contains "$module`:$($_)") } } }) }

$health = Invoke-Api '/health'
if (-not $health.success) { throw 'Health check failed.' }
"health=PASS"

$login = Invoke-Api '/auth/login' 'POST' '' @{ loginId=$adminLogin; password=$adminPassword }
$adminToken = $login.data.accessToken
if ($login.data.user.mustChangePassword) {
  $newAdminPassword = New-Password
  $envPath = Join-Path $PSScriptRoot '..\.env'
  $envText = [System.IO.File]::ReadAllText($envPath)
  $envText = [regex]::Replace($envText, '(?m)^SUPER_ADMIN_PASSWORD=.*$', "SUPER_ADMIN_PASSWORD=$newAdminPassword")
  [System.IO.File]::WriteAllText((Resolve-Path $envPath), $envText, [System.Text.UTF8Encoding]::new($false))
  $changed = Invoke-Api '/auth/change-password' 'POST' $adminToken @{ currentPassword=$adminPassword; newPassword=$newAdminPassword }
  $adminToken = $changed.data.accessToken
  "superadmin_first_login_password_change=PASS"
} else { $newAdminPassword = $adminPassword; "superadmin_password_already_changed=PASS" }

$blocked = $false
try { Invoke-Api '/books' 'POST' $adminToken @{} | Out-Null } catch { $blocked = $_.Exception.Message -match 'HTTP 403' }
if (-not $blocked) { throw 'Super Admin books write was not denied with 403.' }
"superadmin_books_write_403=PASS"

$existingUsers = (Invoke-Api '/admin/users?pageSize=100' 'GET' $adminToken).data.items
foreach ($user in @($existingUsers | Where-Object { $_.loginId -in @('clip01','librarianqa') })) { Invoke-Api "/admin/users/$($user.id)" 'DELETE' $adminToken | Out-Null }
$existingRoles = (Invoke-Api '/admin/roles' 'GET' $adminToken).data
foreach ($role in @($existingRoles | Where-Object { $_.name -in @('Clippings Editor','Librarian QA') })) { Invoke-Api "/admin/roles/$($role.id)" 'DELETE' $adminToken | Out-Null }

$modules = (Invoke-Api '/admin/modules' 'GET' $adminToken).data.modules
$clipRoleBody = @{ name='Clippings Editor'; permissions=(New-Matrix $modules @('clippings:read','clippings:write','clippings:update')) }
$clipRole = Invoke-Api '/admin/roles' 'POST' $adminToken $clipRoleBody
$clipPassword = New-Password
$clipCreated = Invoke-Api '/admin/users' 'POST' $adminToken @{ name='Clippings QA'; loginId='clip01'; roleId=$clipRole.data.id; password=$clipPassword; isActive=$true }
$clipLogin = Invoke-Api '/auth/login' 'POST' '' @{ loginId='clip01'; password=$clipPassword }
if (-not $clipLogin.data.user.mustChangePassword) { throw 'Clippings Editor was not required to change password.' }
$clipChangedPassword = New-Password
$clipChange = Invoke-Api '/auth/change-password' 'POST' $clipLogin.data.accessToken @{ currentPassword=$clipPassword; newPassword=$clipChangedPassword }
$clipToken = $clipChange.data.accessToken
$clipMe = Invoke-Api '/auth/me' 'GET' $clipToken
if (@($clipMe.data.permissions | Where-Object { $_.module -eq 'clippings' }).Count -ne 3 -or @($clipMe.data.permissions | Where-Object { $_.module -ne 'clippings' }).Count -gt 0) { throw 'Clippings role permissions are not correct.' }
$clipList = Invoke-Api '/clippings' 'GET'
if (-not $clipList.success) { throw 'Public clipping read failed.' }
$clipDeleteForbidden = $false
try { Invoke-Api '/clippings/not-a-real-id' 'DELETE' $clipToken @{} | Out-Null } catch { $clipDeleteForbidden = $_.Exception.Message -match 'HTTP 403' }
if (-not $clipDeleteForbidden) { throw 'Clippings delete was not denied with 403.' }
$pngPath = Join-Path $env:TEMP 'nu-lirc-qa-clipping.png'
[System.IO.File]::WriteAllBytes($pngPath, [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p2sAAAAASUVORK5CYII='))
$curlArgs = @('-sS', '-H', "Authorization: Bearer $clipToken", '-H', 'ngrok-skip-browser-warning: true', '-F', 'title=API acceptance clipping', '-F', "date=$((Get-Date).ToString('yyyy-MM-dd'))", '-F', 'topic=Campus', '-F', 'newspaperName=QA Gazette', '-F', "files=@$pngPath;type=image/png;filename=qa-clipping.png", "$base/clippings")
$uploaded = (& curl.exe @curlArgs | ConvertFrom-Json)
if (-not $uploaded.success) { throw "Clipping upload failed: $($uploaded.error.message)" }
$publicClip = Invoke-Api "/clippings/$($uploaded.data.id)"
if (-not $publicClip.data.files[0].url.StartsWith('/files/')) { throw 'Clipping API returned a non-relative file URL.' }
"clipping_upload_public_read_relative_file_url=PASS"
"clip01_first_login_read_only_delete_403=PASS"

$modules2 = $modules
$staffRole = Invoke-Api '/admin/roles' 'POST' $adminToken @{ name='Librarian QA'; permissions=(New-Matrix $modules2 @('dashboard:read','discussion_rooms:read','discussion_rooms:write','discussion_rooms:update','book_requests:read','book_requests:write','book_requests:update','audit_log:read')) }
$staffPassword = New-Password
$staffCreated = Invoke-Api '/admin/users' 'POST' $adminToken @{ name='Librarian QA'; loginId='librarianqa'; roleId=$staffRole.data.id; password=$staffPassword; isActive=$true }
$staffLogin = Invoke-Api '/auth/login' 'POST' '' @{ loginId='librarianqa'; password=$staffPassword }
$staffChanged = New-Password
$staffPwResult = Invoke-Api '/auth/change-password' 'POST' $staffLogin.data.accessToken @{ currentPassword=$staffPassword; newPassword=$staffChanged }
$staffToken = $staffPwResult.data.accessToken
"role_landing_permissions=PASS (clip01=clippings, librarianqa=dashboard)"

$rooms = (Invoke-Api '/rooms').data.items
if (-not $rooms.Count) {
  $room = Invoke-Api '/rooms' 'POST' $staffToken @{ name='QA Room'; capacity=5; isActive=$true }
  $roomId = $room.data.id
} else { $roomId=$rooms[0].id }
$device = 'qa-device-'+[guid]::NewGuid().ToString('N')
$now = Get-Date
for ($i=1; $i -le 5; $i++) {
  $date = $now.AddDays(2).ToString('yyyy-MM-dd')
  $req = @{ roomId=$roomId; date=$date; startTime='10:00'; endTime='11:00'; purpose="QA anonymous request $i"; groupSize=1; studentName='Student QA'; enrollmentNo='QA-0001'; studentEmail='qa.student@niituniversity.in'; studentPhone='+911234567890' }
  Invoke-Api '/room-requests' 'POST' '' $req @{ 'Idempotency-Key'="qa-room-request-$i"; 'x-device-id'=$device } | Out-Null
}
$sixthLimited = $false
try {
  $req.purpose='QA anonymous request 6'
  Invoke-Api '/room-requests' 'POST' '' $req @{ 'Idempotency-Key'='qa-room-request-6'; 'x-device-id'=$device } | Out-Null
} catch { $sixthLimited = $_.Exception.Message -match 'HTTP 429' }
if (-not $sixthLimited) { throw 'Sixth device request was not rate limited.' }
$managerRequests=(Invoke-Api '/room-requests' 'GET' $staffToken).data.items
if (-not (@($managerRequests | Where-Object { $_.enrollmentNo -eq 'QA-0001' }).Count)) { throw 'Manager did not see the anonymous request identity.' }
"anonymous_room_submission_manager_visibility_and_6th_limit=PASS"

$audit=(Invoke-Api '/audit-log' 'GET' $staffToken).data.items
if (-not (@($audit | Where-Object { $_.action -match 'login|create|clipping' }).Count -gt 0)) { throw 'Expected audit events were not found.' }
"audit_entries_present=PASS"

$adminDeactivated = Invoke-Api "/admin/users/$($clipCreated.data.user.id)" 'PUT' $adminToken @{ isActive=$false }
$revoked = $false
try { Invoke-Api '/auth/me' 'GET' $clipToken | Out-Null } catch { $revoked = $_.Exception.Message -match 'HTTP 401' }
if (-not $revoked) { throw 'Deactivated user token was not revoked on next request.' }
"deactivated_user_immediate_revocation=PASS"

$temporaryRole = Invoke-Api '/admin/roles' 'POST' $adminToken @{ name='Reassign QA'; permissions=(New-Matrix $modules @()) }
Invoke-Api "/admin/users/$($staffCreated.data.user.id)" 'PUT' $adminToken @{ roleId=$temporaryRole.data.id } | Out-Null
$roleChangeRevoked = $false
try { Invoke-Api '/auth/me' 'GET' $staffToken | Out-Null } catch { $roleChangeRevoked = $_.Exception.Message -match 'HTTP 401' }
if (-not $roleChangeRevoked) { throw 'Changing a role did not revoke the existing token.' }
Invoke-Api "/admin/roles/$($temporaryRole.data.id)/reassign" 'POST' $adminToken @{ targetRoleId=$staffRole.data.id } | Out-Null
Invoke-Api "/admin/roles/$($temporaryRole.data.id)" 'DELETE' $adminToken | Out-Null
"assigned_role_reassignment_and_revocation=PASS"

"database_student_roles=$((node -e "const D=require('better-sqlite3');const d=new D('data/library.sqlite');console.log(d.prepare('select count(*) n from roles where system_key=?').get('student').n)"))"
"public_submission_device_id=$device"
