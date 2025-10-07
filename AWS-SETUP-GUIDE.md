# AWS S3 File Upload Setup Guide

## 🔑 REQUIRED: Add Your AWS Credentials

### Step 1: Create .env File
Create a `.env` file in your project root with your AWS credentials:

```bash
# Copy from env-template.txt and replace with your actual values
AWS_ACCESS_KEY_ID=your_actual_access_key_id
AWS_SECRET_ACCESS_KEY=your_actual_secret_access_key
S3_REGION=us-west-1
S3_BUCKET=your_actual_bucket_name
```

### Step 2: AWS S3 Bucket Setup
1. **Create S3 Bucket**: `petstore-avatars-2025-yourname`
2. **Region**: `us-west-1` (Oregon)
3. **Uncheck**: "Block all public access"
4. **Enable**: Bucket Versioning
5. **Encryption**: Amazon S3 managed keys (SSE-S3)

### Step 3: Bucket Policy (for public reads)
Add this bucket policy (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

### Step 4: IAM User Policy
Create IAM user with this policy (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    }
  ]
}
```

## 🚀 What's Been Added

### Files Created:
- `config/s3.js` - AWS S3 configuration
- `middleware/upload.js` - File upload middleware
- `env-template.txt` - Environment variables template

### Files Updated:
- `routes/pets.js` - Added file upload handling
- `models/pet.js` - Added S3 file deletion on pet removal
- `views/pets-new.pug` - Updated form for file uploads
- `public/javascripts/scripts.js` - Updated for FormData uploads

### Packages Installed:
- `aws-sdk` - AWS SDK for Node.js
- `multer` - File upload middleware
- `multer-s3` - S3 storage engine for multer

## ✅ Features Added

1. **File Upload**: Upload images directly to S3
2. **Image Validation**: Only image files allowed (5MB max)
3. **Auto-cleanup**: S3 files deleted when pets are removed
4. **Error Handling**: Proper error messages for upload failures
5. **Security**: Files stored with public-read ACL

## 🧪 Testing

1. **Start server**: `npm start`
2. **Visit**: `http://localhost:3000/pets/new`
3. **Upload images**: Select image files instead of URLs
4. **Submit form**: Should upload to S3 and save pet

## 🔧 Troubleshooting

- **403 Forbidden**: Check IAM permissions
- **Bucket not found**: Verify bucket name in .env
- **Upload fails**: Check AWS credentials
- **Images not showing**: Verify bucket policy for public reads
