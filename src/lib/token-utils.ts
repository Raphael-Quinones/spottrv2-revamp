// Token calculation and cost utilities for GPT-5 vision models

// Pricing per million tokens (in USD)
export const PRICING = {
  'gpt-5-nano': {
    input: 0.05 / 1_000_000,  // $0.05 per 1M tokens
    output: 0.40 / 1_000_000  // $0.40 per 1M tokens
  },
  'gpt-5-mini': {
    input: 0.25 / 1_000_000,  // $0.25 per 1M tokens
    output: 2.00 / 1_000_000  // $2.00 per 1M tokens
  },
  'gpt-5': {
    input: 1.25 / 1_000_000,  // $1.25 per 1M tokens
    output: 10.00 / 1_000_000 // $10.00 per 1M tokens
  }
} as const;

export type ModelName = keyof typeof PRICING;

/**
 * Calculate image tokens for GPT-5 vision models
 * Based on OpenAI's approach: 170 tokens per 512x512 tile + 85 base tokens
 */
export function calculateImageTokens(
  imageWidth: number,
  imageHeight: number,
  frameCount: number = 3
): number {
  // Constants based on OpenAI's vision model approach
  const MAX_DIMENSION = 2048;
  const SHORT_SIDE_TARGET = 768;
  const TILE_SIZE = 512;
  const TOKENS_PER_TILE = 170;
  const BASE_TOKENS = 85;

  let width = imageWidth;
  let height = imageHeight;

  // Step 1: Resize to fit within 2048x2048
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // Step 2: If shortest side > 768, resize so shortest side = 768
  if (Math.min(width, height) > SHORT_SIDE_TARGET) {
    const scale = SHORT_SIDE_TARGET / Math.min(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // Step 3: Calculate tiles needed (512x512 each)
  const tilesX = Math.ceil(width / TILE_SIZE);
  const tilesY = Math.ceil(height / TILE_SIZE);
  const tilesPerFrame = tilesX * tilesY;

  // For 1x3 grid (3 frames stacked vertically)
  // We treat the entire grid as one image
  const gridHeight = height * frameCount;
  const gridTilesY = Math.ceil(gridHeight / TILE_SIZE);
  const totalTiles = tilesX * gridTilesY;

  // Calculate total tokens
  const imageTokens = (totalTiles * TOKENS_PER_TILE) + BASE_TOKENS;

  console.log(`Image token calculation:
    Original: ${imageWidth}x${imageHeight}
    Resized: ${width}x${height}
    Grid (1x${frameCount}): ${width}x${gridHeight}
    Tiles: ${tilesX}x${gridTilesY} = ${totalTiles}
    Tokens: ${totalTiles} * ${TOKENS_PER_TILE} + ${BASE_TOKENS} = ${imageTokens}`);

  return imageTokens;
}

/**
 * Calculate cost for a specific model and token usage
 */
export function calculateCost(
  model: ModelName,
  inputTokens: number,
  outputTokens: number
): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  const pricing = PRICING[model];
  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
}

/**
 * Get model name from accuracy level
 */
export function getModelName(accuracyLevel: string): string {
  const modelMap: { [key: string]: string } = {
    'nano': 'gpt-5-nano',
    'mini': 'gpt-5-mini',
    'full': 'gpt-5'
  };
  return modelMap[accuracyLevel] || 'gpt-5-nano';
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

/**
 * Calculate estimated cost for a video
 */
export function estimateVideoCost(
  durationSeconds: number,
  frameInterval: number,
  model: ModelName,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): {
  estimatedGrids: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
} {
  // Calculate number of frames and grids
  const totalFrames = Math.floor(durationSeconds / frameInterval);
  const gridsNeeded = Math.ceil(totalFrames / 3); // 1x3 grids

  // Estimate tokens
  const imageTokensPerGrid = calculateImageTokens(imageWidth, imageHeight, 3);
  const textTokensPerGrid = 150; // Approximate prompt text
  const outputTokensPerGrid = 400; // Approximate response

  const totalInputTokens = gridsNeeded * (imageTokensPerGrid + textTokensPerGrid);
  const totalOutputTokens = gridsNeeded * outputTokensPerGrid;

  // Calculate cost
  const cost = calculateCost(model, totalInputTokens, totalOutputTokens);

  return {
    estimatedGrids: gridsNeeded,
    estimatedInputTokens: totalInputTokens,
    estimatedOutputTokens: totalOutputTokens,
    estimatedCost: cost.totalCost
  };
}