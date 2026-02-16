$API_URL = "http://localhost:4000/api"

# Step 1: Register
Write-Host "Step 1: Registering..."
$registerBody = @{
    email = "test@example.com"
    password = "Test123!@#"
    name = "Test User"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$API_URL/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
$TOKEN = $registerResponse.data.token
Write-Host "Token: $TOKEN"

# Step 2: Get Org
Write-Host "Step 2: Getting org..."
$headers = @{ Authorization = "Bearer $TOKEN" }
$orgResponse = Invoke-RestMethod -Uri "$API_URL/orgs/me" -Method GET -Headers $headers
$ORG_ID = $orgResponse.data.org.id
Write-Host "Org ID: $ORG_ID"

# Step 3: Get Presigned URL
Write-Host "Step 3: Getting presigned URL..."
$presignBody = @{
    orgId = $ORG_ID
    fileName = "test.jpg"
    fileSize = 1048576
    mimeType = "image/jpeg"
    mediaType = "image"
} | ConvertTo-Json

$uploadResponse = Invoke-RestMethod -Uri "$API_URL/upload/presign" -Method POST -Body $presignBody -ContentType "application/json" -Headers $headers
$FILE_KEY = $uploadResponse.data.key
$UPLOAD_URL = $uploadResponse.data.uploadUrl
Write-Host "File Key: $FILE_KEY"

# Step 4: Upload (create dummy file)
"test" | Out-File -FilePath "test.jpg" -Encoding utf8
$fileContent = [System.IO.File]::ReadAllBytes("test.jpg")
Invoke-RestMethod -Uri $UPLOAD_URL -Method PUT -Body $fileContent -ContentType "image/jpeg"
Write-Host "Uploaded file"

# Step 5: Create Job
Write-Host "Step 5: Creating job..."
$jobBody = @{
    orgId = $ORG_ID
    featureSlug = "image.compress"
    mediaType = "IMAGE"
    input = @{
        key = $FILE_KEY
        sizeBytes = 1048576
        mimeType = "image/jpeg"
    }
    params = @{}
} | ConvertTo-Json -Depth 10

$jobResponse = Invoke-RestMethod -Uri "$API_URL/jobs" -Method POST -Body $jobBody -ContentType "application/json" -Headers $headers
$JOB_ID = $jobResponse.data.job.id
Write-Host "Job ID: $JOB_ID"

# Step 6: Wait and check status
Write-Host "Step 6: Waiting for job to complete..."
Start-Sleep -Seconds 5
$statusResponse = Invoke-RestMethod -Uri "$API_URL/jobs/$JOB_ID" -Method GET -Headers $headers
$STATUS = $statusResponse.data.job.status
Write-Host "Job Status: $STATUS"

# Cleanup
Remove-Item -Path "test.jpg" -ErrorAction SilentlyContinue

