// --- ChatGPT Water Footprint Tracker ---
// This script runs on the ChatGPT page, calculates estimated water usage based on
// the word count of each prompt/response, and inserts a banner above the text.

// New model:
// Start at 250 mL, then +63 mL for every 25 words (full blocks of 25).
const BASE_WATER_ML = 250;
const ML_PER_25_WORDS = 63;
const WORDS_PER_STEP = 25;

// Selector for the actual text content within the block.
const TEXT_CONTENT_SELECTOR = "div.markdown.prose, .text-token";

// Selector for the added banner
const BANNER_CONTENT_SELECTOR = "div.banner";

/**
 * Calculates the estimated water usage and returns a formatted string.
 * Starts at 250 mL and adds 63 mL for every 25 words (floor).
 * @param {string} text - The content of the prompt or response.
 * @returns {{words: number, ml: number, display: string}}
 */
function calculateWaterUsage(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) {
        return {
            words: 0,
            ml: BASE_WATER_ML,
            display: `${BASE_WATER_ML.toFixed(2)} mL (Milliliters)`,
        };
    }

    const wordCount = trimmed.split(/\s+/).length;

    // Number of full 25-word blocks
    const blocks = Math.floor(wordCount / WORDS_PER_STEP);

    // Total water usage in mL
    const usageMilliliters = BASE_WATER_ML + blocks * ML_PER_25_WORDS;

    const display = displayMl(usageMilliliters);

    return {
        words: wordCount,
        ml: usageMilliliters,
        display,
    };
}

function displayMl(ml) {
    let display;
    if (ml >= 1000) {
        const usageLiters = ml / 1000;
        display = `${usageLiters.toFixed(2)} L (Liters)`;
    } else {
        display = `${ml.toFixed(2)} mL (Milliliters)`;
    }
    return display;
}

/**
 * Creates and returns the styled banner element.
 * @param {string} usageText - The formatted water usage string.
 * @returns {HTMLElement} - The banner element to inject.
 */
function createBanner(usageText) {
    const banner = document.createElement("div");
    // Using simple, unobtrusive styling to fit with the UI
    banner.style.cssText = `
        margin-bottom: 8px;
        border-radius: 12px;
        padding: 4px 12px;
        background-color: oklch(60.9% 0.126 221.723 / 0.1);
        color: white;
        font-size: 1.5rem;
        font-family: inherit;
        border: 2px solid oklch(60.9% 0.126 221.723);
    `;
    banner.className = "banner";

    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        ${droplets}
        <span style="font-weight: 500;">You just used <span style="font-weight: 700;">${usageText}</span></span>
      </div>
      <div>
        <span style="font-size: 1rem; font-style: italic">
          That's as much as 42 gallons of air
        </span>
      </div>
    `;
    return banner;
}

const droplets = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       class="lucide lucide-droplets-icon lucide-droplets"
       style="color: oklch(60.9% 0.126 221.723);">
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
  </svg>
  `;

function updateChatUsagePill() {
    console.log("this");
    const wrapper = document.querySelector(
        '[data-testid="composer-footer-actions"]',
    );
    const element = wrapper.children?.[0];
    console.log("that", wrapper, element);

    if (element) {
        const chatTotalMl = getChatUsage().reduce((acc, val) => acc + val, 0);

        let pillElement = element.querySelector("[data-water]");
        console.log("those", pillElement);
        if (pillElement) {
            const savedTotalMl = pillElement.getAttribute("data-water");
            if (savedTotalMl === chatTotalMl.toString()) {
                return;
            }
            element.removeChild(pillElement);
        }

        pillElement = document.createElement("div");
        pillElement.className =
            "min-w-9 rounded-full h-full border py-1 px-2 font-sm";
        pillElement.style =
            "font-weight: 600; color: oklch(78.9% 0.154 211.53); background-color: oklch(78.9% 0.154 211.53 / 0.2)";
        pillElement.innerHTML = `<span class="flex items-center gap-2">${droplets}<span>This chat has drank a total of ${displayMl(chatTotalMl)}</span></span>`;
        pillElement.setAttribute("data-water", chatTotalMl);

        console.log("those2", pillElement);
        element.appendChild(pillElement);
    }
}

function getChatUsage() {
    let chatUsage = window.localStorage.getItem(
        `water__${window.location.pathname}`,
    );
    chatUsage = chatUsage ? chatUsage.split(",").map((u) => parseInt(u)) : [];
    return chatUsage;
}

function setChatUsage(chatUsage) {
    window.localStorage.setItem(
        `water__${window.location.pathname}`,
        chatUsage.join(","),
    );
}

/**
 * Processes a single message block (either prompt or response).
 * @param {HTMLElement} block - The main container element for the message.
 */
function processMessageBlock(block) {
    // complete chat usage log
    const chatUsage = getChatUsage();

    // get usage for this block
    const text = block.innerText || block.textContent || "";
    const { ml, display } = calculateWaterUsage(text);

    // Remove an existing banner (if any) so we don't stack them
    let banner = block.querySelector(BANNER_CONTENT_SELECTOR);
    if (banner) {
        const usage = banner.getAttribute("data-usage");
        if (ml.toString() === usage) {
            // no changes needed, we can return early
            return;
        }

        // otherwise, we need to delete the outdated banner
        block.removeChild(banner);
        chatUsage.pop();
    }

    // create banner
    banner = createBanner(display);
    banner.setAttribute("data-usage", ml);
    block.prepend(banner);

    if (respCount > chatUsage.length) {
        chatUsage.push(ml);
        setChatUsage(chatUsage);
    }

    console.log("Water usage banner added:", banner, "for block:", block);
}

let respCount = 0;

const observer = new MutationObserver((mutationsList, observer) => {
    observer.disconnect();

    const responses = document.querySelectorAll(TEXT_CONTENT_SELECTOR);
    respCount = responses.length;
    responses.forEach((resp) => {
        processMessageBlock(resp);
    });
    updateChatUsagePill();

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
