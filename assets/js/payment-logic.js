/**
 * Configuration for "Bayar Gajian" payment method.
 * You can easily change the target date and markup rates here.
 */
const GAJIAN_CONFIG = {
    targetDay: 7, // The day of the month for payday
    markups: [
        { maxDays: 2, rate: 0.01 },
        { maxDays: 3, rate: 0.03 },
        { maxDays: 4, rate: 0.04 },
        { maxDays: 5, rate: 0.05 },
        { maxDays: 7, rate: 0.06 },
        { maxDays: 10, rate: 0.07 },
        { maxDays: 15, rate: 0.10 },
        { maxDays: 20, rate: 0.15 },
        { maxDays: 29, rate: 0.20 }
    ],
    defaultMarkup: 0.25
};

/**
 * Calculates the price for "Bayar Gajian" based on the current date.
 * @param {number} cashPrice - The original cash price of the product.
 * @returns {object} - An object containing the calculated price, days left, and markup percentage.
 */
function calculateGajianPrice(cashPrice) {
    const now = new Date();
    // Offset for WIB (UTC+7)
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWIB = new Date(now.getTime() + wibOffset);
    
    // Set target date to the next payday
    let targetDate = new Date(nowWIB.getFullYear(), nowWIB.getMonth(), GAJIAN_CONFIG.targetDay);
    if (nowWIB.getDate() > GAJIAN_CONFIG.targetDay) {
        targetDate.setMonth(targetDate.getMonth() + 1);
    }
    
    const diffTime = targetDate - nowWIB;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Determine markup based on days left
    let markup = GAJIAN_CONFIG.defaultMarkup;
    for (const range of GAJIAN_CONFIG.markups) {
        if (diffDays <= range.maxDays) {
            markup = range.rate;
            break;
        }
    }
    
    return {
        price: Math.round(cashPrice * (1 + markup)),
        daysLeft: diffDays,
        markupPercent: (markup * 100).toFixed(0)
    };
}

// Exporting for use in other scripts (if using modules) or making it global
if (typeof window !== 'undefined') {
    window.calculateGajianPrice = calculateGajianPrice;
    window.GAJIAN_CONFIG = GAJIAN_CONFIG;
}
