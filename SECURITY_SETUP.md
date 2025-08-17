# 🔒 Security Setup Guide

## ⚠️ IMPORTANT: Never Commit API Keys to GitHub!

### **Why This Matters:**
- **API keys are like passwords** - they give access to your account
- **Public repositories** expose your keys to everyone
- **Unauthorized usage** can result in charges on your account
- **Security breaches** can compromise your data

### **How to Set Up Securely:**

#### **1. Create Your .env File**
```bash
# Copy the template
cp env.template .env

# Edit .env with your actual values
# NEVER commit this file!
```

#### **2. Set Environment Variables**
```bash
# Option A: PowerShell (current session only)
$env:OPENROUTER_API_KEY="your_actual_api_key_here"

# Option B: Windows System Environment Variables (permanent)
# Search "Environment Variables" in Windows settings
# Add OPENROUTER_API_KEY to your user variables
```

#### **3. Verify .gitignore**
Make sure `.env` is in your `.gitignore` file:
```gitignore
.env
.env.local
.env.*
```

### **For Production (Render):**
1. Go to your Render dashboard
2. Add `OPENROUTER_API_KEY` as an environment variable
3. Set the value to your actual API key
4. Never put the key in your code or commit it

### **Testing Your Setup:**
```bash
# Test if the environment variable is set
echo $env:OPENROUTER_API_KEY

# Test the API connection
node test-openrouter.js
```

### **If You Accidentally Committed a Key:**
1. **Immediately rotate/regenerate** the API key
2. **Remove the key** from your Git history
3. **Update all services** using the old key
4. **Review your repository** for other exposed secrets

## 🛡️ Security Best Practices:
- ✅ Use environment variables
- ✅ Keep .env files out of Git
- ✅ Rotate keys regularly
- ✅ Monitor API usage
- ❌ Never hardcode secrets
- ❌ Never commit .env files
- ❌ Never share keys in code
