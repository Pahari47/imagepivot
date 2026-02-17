# R2 CORS Configuration

## Problem
Browser uploads to R2 are blocked by CORS policy when uploading directly from the frontend.

## Solution
Configure CORS on your Cloudflare R2 bucket to allow uploads from your frontend origins.

## Method 1: Cloudflare Dashboard (Easiest)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → Select your bucket (`imagepivot-uploads`)
3. Go to **Settings** → **CORS Policy**
4. Click **Add CORS policy**
5. Paste the following JSON:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

6. Replace `https://your-production-domain.com` with your actual production domain
7. Click **Save**

## Method 2: Cloudflare API

Use the Cloudflare API to set CORS policy:

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/{BUCKET_NAME}/cors" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @r2-cors-config.json
```

Replace:
- `{ACCOUNT_ID}` - Your Cloudflare Account ID
- `{BUCKET_NAME}` - `imagepivot-uploads`
- `{API_TOKEN}` - Your Cloudflare API token with R2 permissions

## Method 3: AWS S3-Compatible API

Since R2 is S3-compatible, you can use AWS CLI or SDK:

```bash
aws s3api put-bucket-cors \
  --bucket imagepivot-uploads \
  --cors-configuration file://r2-cors-config.json \
  --endpoint-url https://{ACCOUNT_ID}.r2.cloudflarestorage.com
```

## Important Notes

1. **Development**: Make sure `http://localhost:3000` is in `AllowedOrigins`
2. **Production**: Add your production domain to `AllowedOrigins`
3. **Wildcards**: You can use `*` for `AllowedOrigins` in development, but it's not recommended for production
4. **Methods**: `PUT` is required for presigned URL uploads
5. **Headers**: `*` allows all headers, which is needed for presigned URLs with custom metadata

## Testing

After configuring CORS, test the upload:
1. Clear browser cache
2. Try uploading a file again
3. Check browser console for CORS errors

If you still see CORS errors:
- Verify the origin matches exactly (including protocol, port, etc.)
- Check that CORS policy was saved correctly
- Wait a few minutes for changes to propagate


