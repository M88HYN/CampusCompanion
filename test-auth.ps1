# Register a test user
$registerBody = @{
    email = 'test@example.com'
    password = 'password123'
    firstName = 'Test'
    lastName = 'User'
} | ConvertTo-Json

Write-Host "Registering user..."
$registerResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/register' `
    -Method Post `
    -ContentType 'application/json' `
    -Body $registerBody `
    -ErrorAction SilentlyContinue

if ($registerResponse.StatusCode -eq 200) {
    $regData = $registerResponse.Content | ConvertFrom-Json
    $token = $regData.token
    Write-Host "Registration successful! Token: $($token.Substring(0, 50))..."
    
    # Now test creating a note with this token
    Write-Host "`nTesting note creation..."
    $noteBody = @{
        title = 'Test Note'
        content = 'This is a test note'
    } | ConvertTo-Json
    
    $headers = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    $noteResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/notes' `
        -Method Post `
        -Headers $headers `
        -Body $noteBody `
        -ErrorAction SilentlyContinue
    
    Write-Host "Note creation response: $($noteResponse.StatusCode)"
    Write-Host "Response: $($noteResponse.Content)"
} else {
    Write-Host "Registration failed: $($registerResponse.StatusCode)"
    Write-Host $registerResponse.Content
}
