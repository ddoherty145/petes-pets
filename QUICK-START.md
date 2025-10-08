# 🚀 Quick Start Guide

## ✅ Current Status
- **MongoDB**: ✅ Running
- **Server**: ✅ Running (no more AWS SDK warnings!)
- **AWS SDK**: ✅ Updated to v3

## 🔑 Next Step: Get Your AWS API Credentials

### Option 1: Use AWS Console (Recommended)
1. **Sign in**: Go to `https://039784671157.signin.aws.amazon.com/console`
2. **Username**: `petstore-s3-user`
3. **Password**: `b-BvD80#`
4. **Navigate**: IAM → Users → `petstore-s3-user` → Security credentials
5. **Create Access Key**: Choose "Application running outside AWS"
6. **Download**: Save the Access Key ID and Secret Access Key

### Option 2: Use AWS CLI (if installed)
```bash
aws configure
# Enter your credentials when prompted
```

## 📝 Create .env File
Create a `.env` file in your project root:

```bash
AWS_ACCESS_KEY_ID=AKIA...your_actual_access_key_id
AWS_SECRET_ACCESS_KEY=wJalr...your_actual_secret_access_key
S3_REGION=us-west-1
S3_BUCKET=your_bucket_name_here
```

## 🧪 Test Your Setup

### 1. Check Server Status
Visit: `http://localhost:3000`
- Should show pet listings (empty if no pets)

### 2. Test New Pet Form
Visit: `http://localhost:3000/pets/new`
- Should show file upload form
- Try uploading an image file

### 3. Test File Upload
1. Fill out the form
2. Select an image file (JPEG/PNG)
3. Click "Save Pet"
4. Should upload to S3 and redirect to pet page

## 🔧 Troubleshooting

### MongoDB Issues
```bash
# If MongoDB stops, restart it:
mongod --dbpath /usr/local/var/mongodb
```

### Server Issues
```bash
# Restart server:
npm start
```

### AWS Issues
- **403 Forbidden**: Check IAM permissions
- **Bucket not found**: Verify bucket name in .env
- **Upload fails**: Check AWS credentials

## 🎯 What's Working Now
- ✅ **File Upload Form**: Single avatar image upload
- ✅ **Model Validation**: Requires avatarUrl field
- ✅ **S3 Integration**: AWS SDK v3 (no warnings)
- ✅ **Backward Compatibility**: Legacy pets still work
- ✅ **Auto-cleanup**: S3 files deleted when pets removed

## 🚀 Ready to Go!
Once you add your AWS credentials to `.env`, your pet store will have full file upload functionality!
