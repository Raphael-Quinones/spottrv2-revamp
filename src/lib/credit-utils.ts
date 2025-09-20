// Credit system utilities with exact 10x markup on GPT-5 nano costs

// GPT-5 nano base costs (per 1k tokens)
const BASE_COSTS = {
  input: 0.00005,  // $0.05 per 1M tokens = $0.00005 per 1k tokens
  output: 0.0004   // $0.40 per 1M tokens = $0.0004 per 1k tokens
} as const;

// Customer pricing with 10x markup (per 1k tokens)
const CUSTOMER_PRICING = {
  input: BASE_COSTS.input * 10,   // $0.0005 per 1k tokens
  output: BASE_COSTS.output * 10  // $0.004 per 1k tokens
} as const;

// 1 credit = $0.001 (0.1 penny)
const CREDIT_VALUE = 0.001;

// Fixed monthly allocation by tier
const FREE_TIER_CREDITS = 1000;
const PRO_TIER_CREDITS = 40000;
const ENTERPRISE_TIER_CREDITS = 100000;

/**
 * Calculate credits from token usage with exact 10x markup
 * This is the CORE function that must match the database function
 * @param inputTokens Number of input tokens used
 * @param outputTokens Number of output tokens used
 * @returns Number of credits to charge (rounded up)
 */
export function calculateCredits(inputTokens: number, outputTokens: number): number {
  // Calculate cost with 10x markup
  const inputCost = (inputTokens / 1000) * CUSTOMER_PRICING.input;
  const outputCost = (outputTokens / 1000) * CUSTOMER_PRICING.output;
  const totalCost = inputCost + outputCost;

  // Convert to credits (round up to ensure we never undercharge)
  return Math.ceil(totalCost / CREDIT_VALUE);
}

/**
 * Calculate our actual cost (for internal tracking)
 * @param inputTokens Number of input tokens used
 * @param outputTokens Number of output tokens used
 * @returns Our actual cost in USD
 */
export function calculateOurCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * BASE_COSTS.input;
  const outputCost = (outputTokens / 1000) * BASE_COSTS.output;
  return inputCost + outputCost;
}

/**
 * Estimate credits needed for video processing
 * Based on actual frame processing patterns with 10-second intervals
 * @param durationSeconds Duration of video in seconds
 * @returns Estimated credits needed
 */
export function estimateVideoCredits(durationSeconds: number): number {
  const frameInterval = 10; // Fixed 10-second intervals
  const frames = Math.floor(durationSeconds / frameInterval);

  // Based on actual measurements with 1x3 grids:
  // - Each grid uses ~2,700 input tokens for the image
  // - Plus ~150 tokens for the prompt
  // - Output is typically ~400 tokens per frame
  const grids = Math.ceil(frames / 3); // 3 frames per grid
  const estimatedInputTokens = grids * (2700 + 150);
  const estimatedOutputTokens = grids * (400 * 3); // 400 per frame, 3 frames per grid

  return calculateCredits(estimatedInputTokens, estimatedOutputTokens);
}

/**
 * Estimate credits needed for a search operation
 * @param videoMinutes Duration of the video in minutes
 * @returns Estimated credits needed for search
 */
export function estimateSearchCredits(videoMinutes: number): number {
  // Search processes existing analysis data in chunks of 40 frames
  const totalFrames = videoMinutes * 6; // 6 frames per minute (10-second intervals)
  const chunks = Math.ceil(totalFrames / 40);

  // Each chunk uses roughly:
  // - 40,000-50,000 input tokens (analysis data + prompt)
  // - 1,000-2,000 output tokens (results)
  const estimatedInputTokens = chunks * 45000;
  const estimatedOutputTokens = chunks * 1500;

  return calculateCredits(estimatedInputTokens, estimatedOutputTokens);
}

/**
 * Format credits for display
 * @param credits Number of credits
 * @returns Formatted string with dollar value
 */
export function formatCredits(credits: number): string {
  const dollarValue = credits * CREDIT_VALUE;
  return `${credits.toLocaleString()} credits ($${dollarValue.toFixed(2)})`;
}

/**
 * Format credit cost breakdown for transparency
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @returns Formatted breakdown string
 */
export function formatCostBreakdown(inputTokens: number, outputTokens: number): string {
  const inputCredits = Math.ceil((inputTokens / 1000) * CUSTOMER_PRICING.input / CREDIT_VALUE);
  const outputCredits = Math.ceil((outputTokens / 1000) * CUSTOMER_PRICING.output / CREDIT_VALUE);
  const totalCredits = calculateCredits(inputTokens, outputTokens);

  return `Input: ${inputTokens.toLocaleString()} tokens (${inputCredits} credits)
Output: ${outputTokens.toLocaleString()} tokens (${outputCredits} credits)
Total: ${totalCredits} credits ($${(totalCredits * CREDIT_VALUE).toFixed(2)})`;
}

/**
 * Get credits for subscription tier
 * @param tier Subscription tier
 * @returns Number of credits allocated monthly
 */
export function getTierCredits(tier: 'free' | 'pro' | 'enterprise'): number {
  switch (tier) {
    case 'free':
      return FREE_TIER_CREDITS;
    case 'pro':
      return PRO_TIER_CREDITS;
    case 'enterprise':
      return ENTERPRISE_TIER_CREDITS;
    default:
      return 0;
  }
}

/**
 * Calculate value metrics
 * @param credits Number of credits
 * @returns Object with dollar value
 */
export function calculateValueMetrics(credits: number): {
  dollarValue: number;
} {
  const dollarValue = credits * CREDIT_VALUE;

  return {
    dollarValue: Math.round(dollarValue * 100) / 100 // Round to cents
  };
}

/**
 * Check if user has sufficient credits for an operation
 * @param balance Current credit balance
 * @param operation Type of operation
 * @param estimatedSize Estimated size (minutes for video, minutes for search)
 * @returns Object with canProceed flag and message
 */
export function checkSufficientCredits(
  balance: number,
  operation: 'process' | 'search',
  estimatedSize?: number
): {
  canProceed: boolean;
  estimatedCredits: number;
  message?: string;
} {
  let estimatedCredits = 0;

  if (operation === 'process') {
    // Minimum 100 credits for any video processing
    estimatedCredits = estimatedSize ? estimateVideoCredits(estimatedSize * 60) : 100;
  } else if (operation === 'search') {
    // Minimum 10 credits for any search
    estimatedCredits = estimatedSize ? estimateSearchCredits(estimatedSize) : 10;
  }

  const canProceed = balance >= estimatedCredits;
  const message = canProceed
    ? undefined
    : `Insufficient credits. Need ${estimatedCredits}, have ${balance}`;

  return { canProceed, estimatedCredits, message };
}

/**
 * Format remaining credits
 * @param credits Number of credits
 * @returns Human-readable string
 */
export function formatRemainingCredits(credits: number): string {
  if (credits === 0) {
    return 'No credits remaining';
  } else {
    return `${credits.toLocaleString()} credits remaining`;
  }
}

// Export constants for use in other modules
export const CREDIT_CONSTANTS = {
  CREDIT_VALUE,
  BASE_COSTS,
  CUSTOMER_PRICING,
  MARKUP_FACTOR: 10,
  FREE_TIER_CREDITS,
  PRO_TIER_CREDITS,
  ENTERPRISE_TIER_CREDITS
} as const;