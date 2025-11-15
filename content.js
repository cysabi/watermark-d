// --- ChatGPT Water Footprint Tracker ---
// This script runs on the ChatGPT page, calculates estimated water usage based on
// the character count of each prompt/response, and inserts a banner above the text.

// A highly simplified and 'terse' estimate:
// 10 nanoliters (0.00000001 Liters) of water per character of LLM interaction.
const WATER_PER_CHAR_LITERS = 0.00000001;

// Selector for the actual text content within the block.
const TEXT_CONTENT_SELECTOR = "div.markdown.prose, .text-token";

// Selector for the added banner
const BANNER_CONTENT_SELECTOR = "div.banner";

/**
 * Calculates the estimated water usage and returns a formatted string.
 * @param {string} text - The content of the prompt or response.
 * @returns {string} - The human-readable water usage estimate.
 */
function calculateWaterUsage(text) {
    const charCount = text.length;
    if (charCount === 0) return "0 nL (Nanoliters)";

    const usageLiters = charCount * WATER_PER_CHAR_LITERS;
    const usageNanoliters = usageLiters * 1e9; // Convert to Nanoliters

    if (usageNanoliters < 1) {
        // If less than 1 nanoliter, display in picoliters (pL)
        return `${(usageNanoliters * 1000).toFixed(2)} pL (Picoliters)`;
    } else if (usageNanoliters < 1000) {
        // Display in nanoliters (nL)
        return `${usageNanoliters.toFixed(2)} nL (Nanoliters)`;
    } else {
        // Display in microliters (µL)
        return `${(usageNanoliters / 1000).toFixed(2)} µL (Microliters)`;
    }
}

/**
 * Creates and returns the styled banner element.
 * @param {string} usageText - The formatted water usage string.
 * @param {number} charCount - The total character count.
 * @returns {HTMLElement} - The banner element to inject.
 */
function createBanner(usage) {
    const banner = document.createElement("div");
    // Using simple, unobtrusive styling to fit with the UI
    banner.style.cssText = `
        margin-bottom: 8px;
        border-radius: 12px;
        padding: 4px 12px;
        background-color: oklch(0.792 0.209 151.711 / 0.1); /* Darker than default ChatGPT BG */
        color: white;
        font-size: 1.5rem;
        font-family: inherit;
        border: 2px solid oklch(0.792 0.209 151.711); /* A blue stripe */
    `;
    banner.className = "banner";

    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-droplets-icon lucide-droplets"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>
        <span style="font-weight: 500;">You just used</span>
        <span style="font-weight: 700;">${usage}</span>
      </div>
      <div>
        <span style="font-size: 1rem; font-style: italic">That's as much as 42 gallons of air</span>
      </div>
    `;
    banner.setAttribute("data-usage", usage);

    return banner;
}

/**
 * Processes a single message block (either prompt or response).
 * @param {HTMLElement} block - The main container element for the message.
 */
function processMessageBlock(block) {
    let deltaUsage = 0;
    let banner = block.querySelector(BANNER_CONTENT_SELECTOR);

    if (banner) {
        deltaUsage -= banner.getAttribute("data-usage");
        block.removeChild(banner);
    }

    const usage = calculateWaterUsage(block.innerHTML);
    banner = createBanner(usage);

    block.prepend(banner);
    console.log(banner, block);
}

const observer = new MutationObserver((mutationsList, observer) => {
    observer.disconnect();

    const responses = document.querySelectorAll(TEXT_CONTENT_SELECTOR);
    responses.forEach((resp) => {
        console.log(resp);
        processMessageBlock(resp);
    });

    observer.observe(document.querySelector("main"), {
        childList: true,
        subtree: true,
    });
});

// Start observing the chat window for dynamically loaded content
observer.observe(document.querySelector("main"), {
    childList: true,
    subtree: true,
});
