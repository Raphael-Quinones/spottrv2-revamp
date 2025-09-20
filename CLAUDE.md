# Spottr - Ctrl+F for Videos

## Project Overview
Spottr is a video analysis platform that uses OpenAI's GPT-5 vision models to process and analyze video content based on user prompts. Users can upload videos, specify what they're looking for, and the system will identify and timestamp relevant moments. Think of it as Ctrl+F for video content.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, React 18
- **UI**: shadcn/ui components, Tailwind CSS
- **Styling**: Brutalist black and white theme
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Database**: Supabase with CLI migrations
- **Billing & Payments**: Autumn (abstraction layer over Stripe)
- **Payment Processing**: Stripe (handled via Autumn)
- **AI**: OpenAI GPT-5 (nano/mini/full) vision models
- **Video Processing**: Frame extraction at configurable intervals

## Core Features

### 1. Video Upload & Processing
- Users upload videos to be analyzed
- Select accuracy level:
  - Accurate (GPT-5 nano)
  - Moderately Accurate (GPT-5 mini)  
  - Highly Accurate (GPT-5)
- Specify analysis scope (e.g., "analyze everything" or "focus on vehicles")
- Video is processed in frames (default 0.5s intervals, user configurable)
- Frames are concatenated with timestamps in upper right
- Progress tracking with percentage display
- Queue system for multiple video processing

### 2. AI Analysis
- Frames sent to OpenAI API with user's prompt
- Results stored with timestamp and analysis data
- Token limit management (350k chunks)
- JSON mode for all API responses
- Results concatenated to video record in database

### 3. Video Analysis & Search
- AI catalogs everything found in the video
- Search happens within individual video's analysis
- Real-time filtering of pre-analyzed data
- Custom video player with timeline highlights
- Jump to specific timestamps from search results

## Database Schema

### Tables

#### videos
- id (uuid, primary key)
- user_id (uuid, foreign key)
- filename (text)
- url (text)
- status (enum: pending, processing, completed, failed)
- accuracy_level (enum: nano, mini, full)
- analysis_scope (text) # What to analyze in the video
- frame_interval (float, default 0.5)
- progress (integer, 0-100)
- created_at (timestamp)
- updated_at (timestamp)

#### video_analysis
- id (uuid, primary key)
- video_id (uuid, foreign key)
- timestamp (float)
- frame_number (integer)
- analysis_result (jsonb) # Contains all detections: {type, description, confidence, bounding_box}
- tokens_used (integer)
- created_at (timestamp)

# Note: search_results table removed - searches are ephemeral and happen client-side

#### users
- id (uuid, primary key)
- email (text)
- subscription_tier (enum: free, pro, enterprise)
- autumn_customer_id (text)
- created_at (timestamp)

## API Structure

### /api/autumn/[...all]
- Autumn handler for billing operations
- Manages subscriptions and usage tracking
- Handles payment flows via Stripe

### /api/upload
- POST: Handle video upload
- Check user's usage limits via Autumn
- Store in Supabase storage
- Create video record
- Queue for processing

### /api/process
- POST: Start video processing
- Track usage with Autumn
- Extract frames at intervals
- Send to OpenAI API
- Store analysis results

# Note: /api/search endpoint removed - search happens client-side on pre-analyzed data

### /api/videos
- GET: List user's videos
- GET /:id: Get video details with analysis

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
AUTUMN_API_KEY=
NEXT_PUBLIC_AUTUMN_BACKEND_URL=
```

## UI/UX Design

### Theme: Brutalist Black & White
- High contrast monochrome palette
- Bold, geometric layouts
- Minimal rounded corners
- Strong typography
- Clear visual hierarchy
- No gradients or shadows
- Stark borders and dividers

### Key Pages
1. **Dashboard**: Video library, processing queue
2. **Upload**: Drag-drop interface, analysis scope selection
3. **Video Detail**: Custom player with integrated search of analysis results
4. **Settings**: Frame interval, API preferences
5. **Billing**: Subscription management

## Implementation Notes

### Video Processing Pipeline
1. Upload video to Supabase storage
2. Extract frames at specified intervals
3. Concatenate frames (4x4 grid or similar)
4. Add timestamp labels to each frame
5. Send to OpenAI with user prompt
6. Store results in database
7. Update progress percentage
8. Send completion notification

### Token Management
- Monitor token usage per request
- Split large videos into 350k token chunks
- Process chunks sequentially
- Aggregate results for search

### Performance Considerations
- Queue system for concurrent processing
- Efficient frame extraction
- Cached search results
- Optimized database queries
- CDN for video delivery

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate TypeScript types from Supabase
npm run db:push      # Push migrations to Supabase
npm run db:reset     # Reset database
```

## Testing Approach
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Mock OpenAI API for development

## Autumn Billing Integration

### How It Works
Autumn acts as an abstraction layer over Stripe, handling all billing complexity with just 3 functions:

1. **attach()** - Create purchases and handle upgrades
2. **check()** - Verify feature access and usage limits
3. **track()** - Record usage events for billing

### Implementation

#### Backend Handler
```typescript
// app/api/autumn/[...all]/route.ts
import { autumnHandler } from "autumn-js/next";
import { createClient } from "@supabase/supabase-js";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    // Get user from Supabase Auth
    const supabase = createClient(/*...*/);
    const { data: { user } } = await supabase.auth.getUser();
    
    return {
      customerId: user?.id,
      customerData: {
        email: user?.email,
      },
    };
  },
});
```

#### Frontend Usage
```typescript
// Upgrade to higher tier
const { attach } = useAutumn();
await attach({ 
  productId: accuracyLevel // "nano", "mini", "full"
});

// Check processing limits
const { check } = useAutumn();
const { data } = await check({ 
  featureId: "video_minutes" 
});
if (!data.allowed) {
  alert("Processing limit reached. Please upgrade.");
}

// Track usage
const { track } = useAutumn();
await track({ 
  featureId: "video_minutes",
  value: videoLengthInMinutes 
});
```

### Pricing Tiers Configuration
Configure in Autumn dashboard:
- **Free Tier**: 10 minutes/month, GPT-5 nano only
- **Pro Tier**: 100 minutes/month, All models
- **Enterprise**: Unlimited, All models + priority

No Stripe SDK or webhook handling required - Autumn manages everything.

## Security Considerations
- Supabase RLS policies for data isolation
- API rate limiting
- Input validation and sanitization
- Secure file upload with type checking
- Autumn handles all payment security and webhooks