# AWS S3 Setup Guide

## ⚠️ Security Notice
**NEVER commit AWS credentials to version control!** This guide shows you how to set up AWS S3 without exposing sensitive information.

## Prerequisites
- AWS Account
- AWS CLI installed (optional but recommended)

## Step 1: Create IAM User
1. Go to AWS Console → IAM → Users
2. Click "Create user"
3. Username: `petstore-s3-user`
4. Select "Programmatic access"
5. Attach policy: `AmazonS3FullAccess` (or create custom policy)
6. **Download the credentials CSV file** (you'll only see this once!)

## Step 2: Create S3 Bucket
1. Go to AWS Console → S3
2. Click "Create bucket"
3. Bucket name: `petstore-avatars-2025-[your-username]`
4. Region: `us-west-1` (N. California)
5. **Disable ACLs** (uncheck "Block all public access" if needed)
6. Click "Create bucket"

## Step 3: Configure Environment Variables
Create a `.env` file in your project root:

```bash
# AWS Credentials (from Step 1 CSV file)
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here

# S3 Configuration
S3_REGION=us-west-1
S3_BUCKET=petstore-avatars-2025-your-username
```

## Step 4: Test Configuration
```bash
# Test S3 connection
node test-pet-store.js
```

## Security Best Practices
- ✅ Use `.env` file for credentials
- ✅ Add `.env` to `.gitignore`
- ✅ Never commit credential files
- ✅ Use IAM policies with minimal permissions
- ✅ Rotate credentials regularly

## Troubleshooting
- **NoSuchBucket**: Check bucket name and region
- **AccessDenied**: Verify IAM permissions
- **AccessControlListNotSupported**: Disable ACLs on bucket

## File Structure
```
petes-pets/
├── .env                    # Your credentials (not in git)
├── .gitignore             # Excludes sensitive files
├── config/s3.js           # S3 configuration
└── routes/pets.js         # Upload routes
```

## Next Steps
1. Start MongoDB: `brew services start mongodb-community`
2. Run tests: `npm test`
3. Start server: `npm start`
4. Test uploads: `http://localhost:3000/pets/new`