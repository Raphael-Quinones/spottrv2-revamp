# Local Video Processing - Development Mode

## ⚠️ IMPORTANT: This is a TEMPORARY development configuration

### Current DEV MODE Settings:
1. **Local Video Storage** - Videos saved to `/tmp/spottr-videos/` instead of Supabase
2. **No Usage Limits** - All usage limit checks are disabled
3. **500MB File Size Limit** - Increased from 50MB Supabase free tier limit

### Current Setup (Development Only)
Videos are currently stored locally on the filesystem instead of Supabase Storage to bypass the 50MB file limit during development. This allows testing with larger video files without upgrading to a paid Supabase plan.

### Files Modified for Local Processing:
1. `/src/app/api/upload/route.ts` - Saves videos locally, skips usage limits
2. `/src/app/api/process/route.ts` - Reads videos from local filesystem
3. `/src/app/(dashboard)/upload/page.tsx` - Disabled usage limit checks in UI

### How to Revert to Supabase Storage (Production):

#### 1. In `/src/app/api/upload/route.ts`:
- Re-enable the usage limit check (uncomment lines 26-34)
- Remove the local file saving code
- Uncomment the Supabase upload code
- Change `localUrl` back to `urlData.publicUrl`
- Change MAX_FILE_SIZE back to 52428800 (50MB)

#### 2. In `/src/app/api/process/route.ts`:
- Remove the local file reading code (lines 399-410)
- Keep only the Supabase download code
- Change cleanup function back to delete all temp files

#### 3. In `/src/app/(dashboard)/upload/page.tsx`:
- Change `canUpload` back to `!usage?.isExceeded` (line 100)
- Uncomment the usage limit check in handleUpload (lines 37-40)

### Limitations of Local Mode:
- Videos are stored in `/tmp` which may be cleared on server restart
- No CDN delivery
- No backup/redundancy
- Can't share video URLs with other users
- Works only in development environment

### When to Switch Back:
- Before deploying to production
- When implementing user sharing features
- When you upgrade to Supabase Pro plan (allows up to 5GB uploads)

### File Size Recommendations:
- Development: Up to 500MB videos work fine locally
- Production Free Tier: Max 50MB per video
- Production Pro Tier: Up to 5GB per video

## Notes:
- The local storage implementation is marked with `// DEV MODE:` comments
- Search for "DEV MODE" to find all temporary code
- The database still stores the file reference - only the actual file storage location changes