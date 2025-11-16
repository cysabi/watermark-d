// --- ChatGPT Water Footprint Tracker ---
// This script runs on the ChatGPT page, calculates estimated water usage based on
// the word count of each prompt/response, and inserts a banner above the text.

// New model:
// Start at 250 mL, then +63 mL for every 25 words (full blocks of 25).
const BASE_WATER_ML = 250;
const ML_PER_25_WORDS = 63;
const WORDS_PER_STEP = 25;

// Tube config: how much water (mL) fills the tube completely
const MAX_TUBE_ML = 3000;

const TEXT_CONTENT_SELECTOR = "div.markdown.prose, .text-token";
const BANNER_CONTENT_SELECTOR = "div.banner";
const TUBE_CONTAINER_ID = "water-usage-tube";
const TUBE_FILL_ID = "water-usage-tube-fill";
const TUBE_LABEL_ID = "water-usage-tube-label";

/**
 * Calculates the estimated water usage for a single block.
 * Starts at 250 mL and adds 63 mL for every FULL 25 words.
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
    const blocks = Math.floor(wordCount / WORDS_PER_STEP);
    const usageMilliliters = BASE_WATER_ML + blocks * ML_PER_25_WORDS;

    let display;
    if (usageMilliliters >= 1000) {
        const usageLiters = usageMilliliters / 1000;
        display = `${usageLiters.toFixed(2)} L (Liters)`;
    } else {
        display = `${usageMilliliters.toFixed(2)} mL (Milliliters)`;
    }

    return {
        words: wordCount,
        ml: usageMilliliters,
        display,
    };
}

/**
 * Initialize the right-side tube UI if it doesn't exist yet.
 * @returns {HTMLElement} - The tube container element.
 */
function initWaterTube() {
    let container = document.getElementById(TUBE_CONTAINER_ID);
    if (container) return container;

    // Main tube container
    container = document.createElement("div");
    container.id = TUBE_CONTAINER_ID;
    container.style.cssText = `
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 40px;
        height: 180px;
        border-radius: 999px;
        border: 2px solid #0d6efd;
        background: rgba(13, 110, 253, 0.08);
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 9999;
    `;

    const fill = document.createElement("div");
    fill.id = TUBE_FILL_ID;
    fill.style.cssText = `
        width: 100%;
        height: 0%;
        background: linear-gradient(to top, #0d6efd, #46a5ff);
        transition: height 0.5s ease-out;
    `;

    container.appendChild(fill);
    document.body.appendChild(container);

    // Label next to the tube
    const label = document.createElement("div");
    label.id = TUBE_LABEL_ID;
    label.style.cssText = `
        position: fixed;
        right: 72px;
        bottom: 24px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.6);
        color: #ffffff;
        font-size: 0.75rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        pointer-events: none;
        z-index: 10000;
    `;
    label.textContent = "0 mL";

    document.body.appendChild(label);

    return container;
}

/**
 * Update the water tube and label for **this message**.
 * It mirrors the same value shown in the banner (non-cumulative).
 * @param {number} ml - Water usage (mL) for the current block.
 */
function updateWaterTube(ml) {
    if (isNaN(ml)) return;

    initWaterTube();

    const fill = document.getElementById(TUBE_FILL_ID);
    const label = document.getElementById(TUBE_LABEL_ID);
    if (!fill || !label) return;

    const fraction = Math.max(0, Math.min(1, ml / MAX_TUBE_ML));
    fill.style.height = (fraction * 100).toFixed(1) + "%";

    if (ml >= 1000) {
        label.textContent = `${(ml / 1000).toFixed(2)} L`;
    } else {
        label.textContent = `${ml.toFixed(0)} mL`;
    }
}

/**
 * Creates and returns the styled blue banner element.
 * @param {string} usageText - The formatted water usage string.
 * @returns {HTMLElement} - The banner element to inject.
 */
function createBanner(usageText) {
    const banner = document.createElement("div");
    banner.style.cssText = `
        margin-bottom: 8px;
        border-radius: 12px;
        padding: 4px 12px;
        background-color: rgba(13, 110, 253, 0.2);
        color: #0b1f3b;
        font-size: 1.1rem;
        font-family: inherit;
        border: 2px solid #0d6efd;
    `;
    banner.className = "banner";

    banner.innerHTML = `
<<<<<<< HEAD
      <div style="display: flex; justify-content: space-between; align-items: center;">
        ${droplets}
        <span style="font-weight: 500;">You just used <span style="font-weight: 700;">${usageText}</span></span>
      </div>
      <div>
        <span style="font-size: 0.85rem; font-style: italic">
          (Visualized in the tube ➜)
        </span>
      </div>
    `;

    banner.setAttribute("data-usage", usageText);
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
    // Remove existing banner if present (we'll recreate it)
    let banner = block.querySelector(BANNER_CONTENT_SELECTOR);
    if (banner) {
        banner.remove();
    }

    const text = block.innerText || block.textContent || "";
    const { ml, display } = calculateWaterUsage(text);

    // Store the per-block usage (in case you want to use it later)
    block.setAttribute("data-water-ml", ml.toString());

    // Update tube to visually match this message
    updateWaterTube(ml);

    // Add fresh banner
    banner = createBanner(display);
    block.prepend(banner);
    console.log("Water usage banner + tube updated for block:", { ml });
}

function startObserver() {
    // Ensure tube exists once we start
    initWaterTube();

    const observer = new MutationObserver((mutationsList, observer) => {
        observer.disconnect();

        const responses = document.querySelectorAll(TEXT_CONTENT_SELECTOR);
        responses.forEach((resp) => {
            processMessageBlock(resp);
        });

        const main = document.querySelector("main");
        if (main) {
            observer.observe(main, {
                childList: true,
                subtree: true,
            });
        }
    });

    const main = document.querySelector("main");
    if (main) {
        observer.observe(main, {
            childList: true,
            subtree: true,
        });
    }
}

// Start when ready
if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", startObserver);
} else {
    startObserver();
}