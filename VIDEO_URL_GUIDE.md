# Video URL Guide - How to Get Direct Video File URLs

## ⚠️ Important

**FFmpeg requires direct links to video files**, not webpage URLs. The API cannot process HTML pages or video player pages.

---

## ✅ Valid Video URLs (Direct File Links)

These URLs work because they point directly to video files:

```
✅ https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4
✅ https://example.com/videos/my-video.mp4
✅ https://cdn.example.com/video.avi
✅ https://storage.googleapis.com/bucket/video.mov
```

**Characteristics:**
- End with video file extensions: `.mp4`, `.avi`, `.mov`, `.mkv`, `.webm`, etc.
- Directly accessible (no login required)
- Return video file content, not HTML

---

## ❌ Invalid Video URLs (Webpage Links)

These URLs **DO NOT WORK** because they point to HTML pages:

```
❌ https://www.pexels.com/video/spinning-clock-6890305/
❌ https://pixabay.com/videos/spinning-clock-6890305/
❌ https://www.youtube.com/watch?v=VIDEO_ID
❌ https://vimeo.com/VIDEO_ID
```

**Why they fail:**
- These are HTML pages, not video files
- FFmpeg cannot parse HTML pages
- You need the actual video file URL

---

## 🔍 How to Get Direct Video URLs

### Method 1: Sample Video URLs (For Testing)

Use these publicly available test videos:

```json
{
  "videoUrl": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
  "timestamps": [1000, 5000]
}
```

More sample videos:
- `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4`
- `https://sample-videos.com/video123/mp4/480/big_buck_bunny_480p_1mb.mp4`

### Method 2: Pexels Videos

1. Go to Pexels video page (e.g., `https://www.pexels.com/video/...`)
2. **Right-click** on the video player
3. Select **"Copy video address"** or **"Inspect"**
4. In browser DevTools, look for the `<video>` tag's `src` attribute
5. Copy the direct `.mp4` URL

**Example:**
- Page URL: `https://www.pexels.com/video/spinning-clock-6890305/`
- Direct URL: `https://videos.pexels.com/video-files/6890305/6890305-uhd_2560_1440_25fps.mp4`

### Method 3: Pixabay Videos

1. Go to Pixabay video page
2. Click **"Free Download"**
3. Select **"Video"** tab
4. Copy the direct download URL (ends with `.mp4`)

### Method 4: YouTube Videos

**Note:** YouTube videos require special handling and may not work directly due to restrictions.

For testing, use sample video URLs instead.

### Method 5: Your Own Videos

1. Upload video to cloud storage (AWS S3, Google Cloud Storage, etc.)
2. Make the file publicly accessible
3. Use the direct file URL

---

## 🧪 Testing with Postman

### Valid Request Example:

```json
{
  "videoUrl": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
  "timestamps": [1000, 5000, 10000]
}
```

### Expected Response:

```json
{
  "videoUrl": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
  "results": [
    { "timestamp": 1000, "color": "#FF7850" },
    { "timestamp": 5000, "color": "#6496C8" },
    { "timestamp": 10000, "color": "#A3D5C7" }
  ]
}
```

---

## 🐛 Common Errors & Solutions

### Error: "Invalid video URL. Please provide a direct link..."

**Solution:** You're using a webpage URL. Get the direct video file URL instead.

### Error: "Video URL not accessible"

**Solution:** 
- Check if the URL is publicly accessible (no login required)
- Verify the URL in a browser first
- Ensure the video file exists

### Error: "Invalid data found when processing input"

**Solution:**
- URL points to HTML page, not video file
- Use a direct video file URL

---

## ✅ Quick Checklist

Before using a video URL, verify:

- [ ] URL ends with `.mp4`, `.avi`, `.mov`, or other video extension
- [ ] URL is publicly accessible (test in browser)
- [ ] URL returns video file, not HTML page
- [ ] Video file exists and is not corrupted

---

## 📝 Summary

**Use:** Direct video file URLs (`.mp4`, `.avi`, `.mov`, etc.)  
**Don't use:** Webpage URLs (Pexels pages, YouTube pages, etc.)

For testing, use sample video URLs from `sample-videos.com` or get direct URLs from video hosting sites using browser DevTools.
