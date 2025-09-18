# Demo Video Setup Guide

## Required Demo Videos

The following video files need to be manually uploaded to your VPS/production environment:

### 1. NYC Dashcam Demo Video
- **File**: `demo-dashcam.mp4`
- **Size**: ~286 MB
- **Duration**: 87 minutes
- **Location**: Should be placed in `/public/demo-videos/demo-dashcam.mp4`
- **Video ID in Database**: `5728109e-abb3-43af-b0ff-88360b9a5adc`

## Upload Instructions

1. **Create the directory on your VPS:**
   ```bash
   mkdir -p /path/to/your/app/public/demo-videos
   ```

2. **Upload the video file:**
   ```bash
   # From your local machine
   scp /path/to/demo-dashcam.mp4 your-server:/path/to/your/app/public/demo-videos/

   # Or using rsync for better resume capability
   rsync -avP /path/to/demo-dashcam.mp4 your-server:/path/to/your/app/public/demo-videos/
   ```

3. **Set proper permissions:**
   ```bash
   chmod 644 /path/to/your/app/public/demo-videos/demo-dashcam.mp4
   ```

## Important Notes

- The demo video is **NOT** included in the Git repository due to file size limitations
- The database already contains the analysis data for this video (261 analyzed frames)
- The video URL in the database points to: `/demo-videos/demo-dashcam.mp4`
- Ensure your web server (nginx/apache) is configured to serve files from the `public` directory
- The video is protected from deletion through database policies and application logic

## Verification

After uploading, verify the demo video is accessible:

1. Visit: `https://your-domain.com/demo-videos/demo-dashcam.mp4`
2. Check the demo video page: `https://your-domain.com/videos/5728109e-abb3-43af-b0ff-88360b9a5adc`
3. Ensure search functionality works on the demo video

## Alternative Hosting Options

If you prefer not to host the video on your VPS:

1. **CDN/Object Storage**: Upload to S3, Cloudflare R2, or similar
2. **Update Database**: Change the video URL in the database to point to the external location
   ```sql
   UPDATE videos
   SET url = 'https://your-cdn.com/demo-dashcam.mp4'
   WHERE id = '5728109e-abb3-43af-b0ff-88360b9a5adc';
   ```

## Demo Video Details

- **Content**: NYC driving footage showcasing various vehicles, street scenes, and urban environments
- **Purpose**: Allows new users to explore the platform's capabilities without uploading their own content
- **Analysis**: Pre-analyzed with GPT-5 for vehicle detection and scene understanding