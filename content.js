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
    const bottles = (parseFloat((ml / 500).toFixed(1)) + 0.1).toFixed(1);
    return bottles;
}

function createBanner(usageText, semanticText) {
    const banner = document.createElement("div");
    // Using simple, unobtrusive styling to fit with the UI
    banner.style.cssText = `
        margin-bottom: 12px;
        border-radius: 12px;
        padding: 4px 12px;
        background-color: oklch(78.9% 0.154 211.53 / 0.2);
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
            That's roughly enough to fill ${semanticText} water bottles!
          </div>
        </div>
      </div>
    `;
    return banner;
}

const droplets = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-milk-icon lucide-milk">
  <path d="M8 2h8"/><path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2"/><path d="M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/></svg>`;

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
            "min-w-9 rounded-full h-full border py-1 px-2.5 font-sm";
        pillElement.style =
            "font-weight: 500; color: oklch(78.9% 0.154 211.53); border-color: oklch(78.9% 0.154 211.53 / 0.5); background-color: oklch(78.9% 0.154 211.53 / 0.2)";
        pillElement.innerHTML = `<span class="flex items-center gap-2">${droplets}<span>This chat has drank <span style="font-weight: 600;">~${semanticMl(chatTotalMl)} water bottles</span></span></span>`;
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
