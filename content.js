const TEXT_CONTENT_SELECTOR = "div.markdown.prose, .text-token"; // Selector for the actual text content within the block.
const BANNER_CONTENT_SELECTOR = "div.banner"; // Selector for the added banner

const BASE_WATER_ML = 250;
const ML_PER_25_WORDS = 63;
const WORDS_PER_STEP = 25;
function calculateWaterUsage(text) {
    let ml =
        BASE_WATER_ML + (text.length / 4 / WORDS_PER_STEP) * ML_PER_25_WORDS;
    ml = Math.round(ml * 100) / 100;

    return {
        ml: Math.ceil(ml),
        display: displayMl(ml),
        semantic: semanticMl(ml),
    };
}

function displayMl(ml) {
    let display;
    if (ml >= 1000) {
        const usageLiters = ml / 1000;
        display = `~${usageLiters.toFixed(2)} L (Liters)`;
    } else {
        display = `~${ml.toFixed(2)} mL (Milliliters)`;
    }
    return display;
}

function semanticMl(ml) {
    if (ml <= 0) return "No water used—no impact!";

    const liters = ml / 1000;

    // Constants
    const bottleMl = 500; // 1 standard water bottle
    const showerMlPerMin = 950; // Average shower uses 9.5 liters/min
    const dailyHumanNeedsLiters = 50; // Minimum daily water to keep 1 person alive

    // Calculate derived values
    const showerMinutes = liters / (showerMlPerMin / 1000); // minutes of shower
    const peopleDays = liters / dailyHumanNeedsLiters; // number of person-days

    if (showerMinutes < 10) {
        const bottles = (ml / bottleMl).toFixed(1);
        return `That's roughly enough to fill ${bottles} water bottles`;
    } else if (peopleDays < 2) {
        return `That's roughly enough to shower for ${showerMinutes.toFixed(1)} minutes`;
    } else {
        return `That's roughly enough water to keep someone alive for ${peopleDays.toFixed(2)} days`;
    }
}

function createBanner(usageText, semanticText) {
    const banner = document.createElement("div");
    // Using simple, unobtrusive styling to fit with the UI
    banner.style.cssText = `
        margin-bottom: 12px;
        border-radius: 12px;
        padding: 4px 12px;
        background-color: oklch(78.9% 0.154 211.53 / 0.1);
        color: white;
        font-size: 1.5rem;
        font-family: inherit;
        border: 1px solid oklch(78.9% 0.154 211.53 / 0.5);
    `;
    banner.className = "banner";

    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="display: flex; align-items: center; gap: 12px; color: oklch(78.9% 0.154 211.53);">
          ${droplets}
          <span style="font-weight: 600; font-size: 20px;">Your query just used...</span>
        </span>
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <div style="font-weight: 700;">${usageText}</div>
          <div style="font-weight: 500; font-size: 1rem; font-style: italic">
            ${semanticText}!
          </div>
        </div>
      </div>
    `;
    return banner;
}

const droplets = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       class="lucide lucide-droplets-icon lucide-droplets">
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
  </svg>
  `;

function updateChatUsagePill() {
    const wrapper = document.querySelector(
        '[data-testid="composer-footer-actions"]',
    );
    const element = wrapper?.children?.[0];

    if (element) {
        const chatTotalMl = getChatUsage().reduce((acc, val) => acc + val, 0);

        let pillElement = element.querySelector("[data-water]");
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
            "font-weight: 600; color: oklch(78.9% 0.154 211.53); border-color: oklch(78.9% 0.154 211.53 / 0.5); background-color: oklch(78.9% 0.154 211.53 / 0.2)";
        pillElement.innerHTML = `<span class="flex items-center gap-2">${droplets}This chat has used ${displayMl(chatTotalMl)} total</span>`;
        pillElement.setAttribute("data-water", chatTotalMl);

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

function processMessageBlock(block) {
    // complete chat usage log
    const chatUsage = getChatUsage();

    // get usage for this block
    const text = block.innerText || block.textContent || "";
    const { ml, display, semantic } = calculateWaterUsage(text);

    // Remove an existing banner (if any) so we don't stack them
    let banner = block.querySelector(BANNER_CONTENT_SELECTOR);
    if (banner) {
        const oldUsage = banner.getAttribute("data-usage");
        if (oldUsage === ml.toString()) {
            return;
        }

        block.removeChild(banner);
        chatUsage.pop();
    }

    // create banner
    banner = createBanner(display, semantic);
    banner.setAttribute("data-usage", ml);
    block.prepend(banner);

    if (respCount > chatUsage.length) {
        chatUsage.push(ml);
        setChatUsage(chatUsage);
    }
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
