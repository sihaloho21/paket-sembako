/**
 * Tiered Pricing Logic for Customer Side
 */

/**
 * Calculate tiered price based on quantity
 * @param {number} basePrice - The original price
 * @param {number} quantity - The quantity being purchased
 * @param {Array|string} tieredPrices - The tiered pricing data (JSON string or Array)
 * @returns {number} - The effective price per unit
 */
function calculateTieredPrice(basePrice, quantity, tieredPrices) {
    if (!tieredPrices) return basePrice;
    
    let tiers = [];
    if (typeof tieredPrices === 'string') {
        try {
            tiers = JSON.parse(tieredPrices);
        } catch (e) {
            console.error('Error parsing tiered prices:', e);
            return basePrice;
        }
    } else {
        tiers = tieredPrices;
    }
    
    if (!Array.isArray(tiers) || tiers.length === 0) {
        return basePrice;
    }
    
    // Sort by min_qty descending to find the highest applicable tier
    const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
    
    let effectivePrice = basePrice;
    for (const tier of sorted) {
        if (quantity >= tier.min_qty) {
            effectivePrice = tier.price;
            break;
        }
    }
    
    return effectivePrice;
}

/**
 * Get the next tier information for progress bar
 * @param {number} quantity - Current quantity
 * @param {Array|string} tieredPrices - Tiered pricing data
 * @returns {object|null} - Next tier info or null if no more tiers
 */
function getNextTierInfo(quantity, tieredPrices) {
    if (!tieredPrices) return null;
    
    let tiers = [];
    if (typeof tieredPrices === 'string') {
        try {
            tiers = JSON.parse(tieredPrices);
        } catch (e) {
            return null;
        }
    } else {
        tiers = tieredPrices;
    }
    
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    
    // Sort by min_qty ascending
    const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
    
    for (const tier of sorted) {
        if (quantity < tier.min_qty) {
            return tier;
        }
    }
    
    return null;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.calculateTieredPrice = calculateTieredPrice;
    window.getNextTierInfo = getNextTierInfo;
}
