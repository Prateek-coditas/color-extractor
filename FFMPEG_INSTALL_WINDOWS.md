# Installing FFmpeg on Windows (Manual Method)

## Quick Installation Steps

### Method 1: Using Winget (Windows 11/10 with App Installer)

1. **Open PowerShell as Administrator:**
   - Right-click PowerShell → "Run as Administrator"

2. **Install FFmpeg:**
   ```powershell
   winget install ffmpeg
   ```

3. **Restart PowerShell** (close and reopen)

4. **Verify:**
   ```powershell
   ffmpeg -version
   ```

---

### Method 2: Manual Download & Install

1. **Download FFmpeg:**
   - Go to: https://www.gyan.dev/ffmpeg/builds/
   - Click "ffmpeg-release-essentials.zip" (or latest version)

2. **Extract:**
   - Extract the ZIP to: `C:\ffmpeg`
   - You should have: `C:\ffmpeg\bin\ffmpeg.exe`

3. **Add to PATH:**
   - Press `Win + R`, type: `sysdm.cpl`, press Enter
   - Click "Environment Variables" button
   - Under "System variables", find "Path", click "Edit"
   - Click "New"
   - Add: `C:\ffmpeg\bin`
   - Click OK on all dialogs

4. **Restart PowerShell/Terminal:**
   - Close ALL PowerShell/Command Prompt windows
   - Open a new PowerShell window

5. **Verify:**
   ```powershell
   ffmpeg -version
   ```

---

### Method 3: Using Scoop (If you have it)

```powershell
scoop install ffmpeg
```

---

## ✅ After Installation

**IMPORTANT:** Always restart your terminal/PowerShell after adding FFmpeg to PATH!

**Verify installation:**
```powershell
ffmpeg -version
```

You should see version information like:
```
ffmpeg version 6.0-essentials_build-www.gyan.dev Copyright (c) 2000-2023...
```

---

## 🔍 Troubleshooting

### Still not recognized after installation?

1. **Verify FFmpeg is in the correct location:**
   ```powershell
   Test-Path "C:\ffmpeg\bin\ffmpeg.exe"
   ```
   Should return: `True`

2. **Check PATH:**
   ```powershell
   $env:PATH -split ';' | Select-String ffmpeg
   ```
   Should show FFmpeg path

3. **If PATH doesn't include FFmpeg:**
   - Re-add to PATH (see Method 2, step 3)
   - **Restart PowerShell**

4. **Test directly:**
   ```powershell
   C:\ffmpeg\bin\ffmpeg.exe -version
   ```
   If this works, PATH is the issue - add it to PATH again

---

## ⚠️ Note

After installing FFmpeg:
- ✅ Restart ALL terminal/PowerShell windows
- ✅ Verify with `ffmpeg -version`
- ✅ Then start your NestJS server
