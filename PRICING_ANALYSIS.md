# Spottr Pricing Analysis

## Current Implementation Status

### Video Processing Pipeline
- **Frame extraction**: 0.5s default interval (configurable 0.1s to 5s)
- **Grid creation**: 1x3 vertical grids at original resolution
- **Models available**: GPT-5 Nano, Mini, Full
- **Processing**: Manual trigger via button click
- **Storage**: Supabase for videos and analysis results

### Usage Tracking (Current)
- Database table: `usage_tracking`
- Monthly limits tracked in minutes
- Tiers: Free (10min), Pro (100min), Enterprise (unlimited)
- Function: `check_usage_limit()` enforces limits

## API Cost Analysis

### Token Usage Per Video Minute

#### Frame & Grid Calculation
- Default interval: 0.5 seconds
- Frames per minute: 120
- Grids (1x3): 40 API calls per minute

#### Token Consumption (HD Video 1920x1080)
- Image tokens per grid: ~6,205 tokens
- Text prompt tokens: ~150 tokens
- Output tokens: ~400 tokens
- **Total per grid**: 6,355 input + 400 output tokens
- **Total per minute**: 254,200 input + 16,000 output tokens

### Cost Per Minute by Model

| Model | Input ($/1M) | Output ($/1M) | Cost per Minute |
|-------|-------------|--------------|-----------------|
| GPT-5 Nano | $0.05 | $0.40 | **$0.019** |
| GPT-5 Mini | $0.25 | $2.00 | **$0.096** |
| GPT-5 Full | $1.25 | $10.00 | **$0.478** |

### Frame Interval Impact on Costs

| Interval | Frames/min | API Calls | Cost Multiplier |
|----------|------------|-----------|-----------------|
| 0.1s | 600 | 200 | 5x |
| 0.5s (default) | 120 | 40 | 1x |
| 1.0s | 60 | 20 | 0.5x |
| 2.0s | 30 | 10 | 0.25x |
| 5.0s | 12 | 4 | 0.1x |

## Pricing Model Options

### Option 1: Minutes-Based (Simple)

**All users get same model (e.g., Mini)**

#### Proposed Tiers
| Tier | Price | Minutes | API Cost | Margin |
|------|-------|---------|----------|--------|
| Free | $0 | 5 | $0.48 | Loss leader |
| Starter | $9.99 | 30 | $2.88 | 71% |
| Pro | $29.99 | 150 | $14.40 | 52% |
| Business | $99.99 | 600 | $57.60 | 42% |

**Pros:**
- Dead simple: "X minutes of video"
- Easy to understand and market
- Predictable costs

**Cons:**
- No model flexibility
- Heavy users of Full model would destroy margins

### Option 2: Credits-Based (Flexible)

**Different models consume different credits**

#### Credit Consumption
| Model | Credits per Minute |
|-------|-------------------|
| Nano | 2 |
| Mini | 10 |
| Full | 48 |

#### Proposed Tiers
| Tier | Price | Credits | Nano Min | Mini Min | Full Min |
|------|-------|---------|----------|----------|----------|
| Starter | $9.99 | 500 | 250 | 50 | 10 |
| Pro | $29.99 | 2,000 | 1,000 | 200 | 42 |
| Business | $99.99 | 8,000 | 4,000 | 800 | 167 |

**Pros:**
- Fair pricing based on actual usage
- Users can choose quality/cost tradeoff
- Sustainable at any usage pattern

**Cons:**
- More complex to explain
- Harder for users to predict costs

### Option 3: Hybrid Model

**Minutes with multipliers for different models**

- Nano: 0.5x minutes consumed
- Mini: 1x minutes consumed (base)
- Full: 5x minutes consumed

**Example:** 100 minute plan
- 200 minutes with Nano
- 100 minutes with Mini
- 20 minutes with Full

## Billing Implementation Options

### Option A: Stripe Direct Integration

**Requirements:**
1. Stripe webhook handler (~500 lines)
2. Subscription management logic
3. Usage reporting to Stripe
4. Customer portal integration
5. Database schema updates

**Database Changes:**
```sql
ALTER TABLE users ADD
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  current_period_end TIMESTAMP;
```

**Estimated Development:** 2-3 weeks

### Option B: Autumn Integration

**Benefits:**
- 3 functions only: `attach()`, `check()`, `track()`
- No webhook management
- Built-in usage tracking
- Automatic Stripe handling
- UI components included

**Cost:** $375/month (startup plan)

**Estimated Development:** 2-3 days

## Recommendations

### Short Term (MVP)
1. **Keep current setup** with manual usage tracking
2. **Use single model** (Mini) for simplicity
3. **Charge by minutes** not credits
4. **Default to 1s interval** to reduce costs by 50%

### Medium Term (Post-Launch)
1. **Add Stripe integration** for actual payments
2. **Consider credits** if users want model flexibility
3. **Implement frame interval pricing** (premium for <0.5s)

### Long Term (Scale)
1. **Optimize costs** with caching for similar frames
2. **Bulk processing discounts**
3. **Enterprise custom pricing**

## Key Decisions Needed

1. **Single model or multiple?**
   - Single (Mini): Simple but inflexible
   - Multiple: Complex but fair

2. **Minutes or credits?**
   - Minutes: Easy to understand
   - Credits: Accurate cost allocation

3. **Billing platform?**
   - Stripe direct: More work, full control
   - Autumn: Fast setup, monthly fee

4. **Default frame interval?**
   - 0.5s: Higher quality, 2x cost
   - 1.0s: Good balance
   - 2.0s: Lower quality, 4x cheaper

## Monthly Cost Projections

### 100 Active Users Scenario

| Model | Avg Usage | Total Minutes | API Cost | Revenue @ $30/user | Profit |
|-------|-----------|---------------|----------|-------------------|--------|
| All Nano | 50 min | 5,000 | $95 | $3,000 | $2,905 |
| All Mini | 50 min | 5,000 | $480 | $3,000 | $2,520 |
| All Full | 50 min | 5,000 | $2,390 | $3,000 | $610 |
| Mixed (realistic) | 50 min | 5,000 | ~$350 | $3,000 | $2,650 |

## Action Items

1. **Test models** to determine quality differences
2. **Survey users** about pricing preferences
3. **Set up Stripe** test environment
4. **Finalize frame interval** defaults
5. **Choose billing approach** (Stripe vs Autumn)