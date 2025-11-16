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
    const bottles = Math.round(parseFloat(ml / 500) * 10) / 10;
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

const droplets = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-glass-water-icon lucide-glass-water"><path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z"/><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"/></svg>`;

function updateChatUsagePill() {
    const element = document.querySelector("#conversation-header-actions");
    const chatUsage = getChatUsage();
    const chatTotalMl = chatUsage
        ? chatUsage.reduce((acc, val) => acc + val, 0)
        : -1;

    if (element) {
        let pillElement = element.querySelector("[data-water]");
        if (pillElement) {
            const savedTotalMl = pillElement.getAttribute("data-water");

            if (savedTotalMl === chatTotalMl.toString()) {
                return;
            }
            element.removeChild(pillElement);
        }

        if (!getChatUsage()) return;

        pillElement = document.createElement("div");
        pillElement.className = "flex";
        pillElement.innerHTML = `
          <div class="min-w-9 rounded-full h-full border py-1 px-2.5"
               style="font-weight: 500; color: oklch(78.9% 0.154 211.53); border-color: oklch(78.9% 0.154 211.53 / 0.5); background-color: oklch(78.9% 0.154 211.53 / 0.2);">
            <span class="flex items-center gap-2">
              ${droplets}
              <span>This chat has drank <span style="font-weight: 600;">~${semanticMl(chatTotalMl)} water bottles</span>
            </span>
          </div>
          `;
        pillElement.setAttribute("data-water", chatTotalMl);

        element.prepend(pillElement);
    }
}

function updateGlobalUsagePill() {
    const element = document.querySelector(
        "div.sticky.bottom-0.z-30.empty\\:hidden.bg-token-bg-elevated-secondary div.relative",
    )?.children?.[0];
    const usage = getGlobalChatUsage();

    if (element) {
        let pillElement = element.querySelector("[data-water]");
        if (pillElement) {
            const savedTotalMl = pillElement.getAttribute("data-water");

            if (savedTotalMl === usage.toString()) {
                return;
            }
            element.removeChild(pillElement);
        }

        pillElement = document.createElement("div");
        pillElement.className = "flex";
        pillElement.innerHTML = `
          <span class="flex w-full items-center gap-1 mx-3 rounded-full h-full border py-1 px-2 text-sm"
                style="border-color: oklch(78.9% 0.154 211.53 / 0.5); background-color: oklch(78.9% 0.154 211.53 / 0.2);">
            <span style="color: oklch(71.5% 0.143 215.221);">${droplets}</span>
            <span style="font-weight: 600;">${semanticMl(usage)} total water bottles used</span>
          </span>
          `;
        pillElement.setAttribute("data-water", usage);

        console.log(pillElement);

        element.prepend(pillElement);
    }
}

function getChatUsage() {
    const chatId = window.location.pathname.split("/").at(-1);
    if (!chatId) {
        return null;
    }
    let usage = JSON.parse(window.localStorage.getItem(`waterusage`) ?? "{}");
    if (!usage[chatId]) {
        usage[chatId] = [];
    }
    return usage[chatId];
}

function getGlobalChatUsage() {
    let total = 0;
    let usage = JSON.parse(window.localStorage.getItem(`waterusage`) ?? "{}");
    Object.values(usage).forEach((value) => {
        total += value.reduce((acc, val) => acc + val, 0);
    });
    return total;
}

function setChatUsage(chatUsage) {
    const chatId = window.location.pathname.split("/").at(-1);
    if (!chatId) {
        return null;
    }

    let usage = JSON.parse(window.localStorage.getItem(`waterusage`) ?? "{}");
    usage[chatId] = chatUsage;

    window.localStorage.setItem(`waterusage`, JSON.stringify(usage));
}

function processMessageBlock(block, i) {
    // complete chat usage log
    const chatUsage = getChatUsage();

    // get usage for this block
    const text = block.innerText || block.textContent || "";
    const { ml, display, semantic } = calculateWaterUsage(text);
    console.log(ml, display);

    // Remove an existing banner (if any) so we don't stack them
    let banner = block.querySelector(BANNER_CONTENT_SELECTOR);
    if (banner) {
        const oldUsage = parseInt(banner.getAttribute("data-water"));
        if (oldUsage === ml) {
            return;
        }

        if (chatUsage) {
            const updatedI = chatUsage.findIndex(
                (elem, i) => elem === oldUsage,
            );
            console.log(chatUsage, updatedI);
            if (updatedI !== -1) {
                chatUsage[updatedI] = ml;
                setChatUsage(chatUsage);
            }
        }

        block.removeChild(banner);
    }

    // create banner
    banner = createBanner(display, semantic);
    banner.setAttribute("data-water", ml);
    block.prepend(banner);

    if (chatUsage && respCount > chatUsage.length) {
        chatUsage.push(ml);
        setChatUsage(chatUsage);
    }
}

// new elemet
// no value, count is > length, push new value
// value exists, element doesnt exist
// -
// both exist

let respCount = 0;

const observer = new MutationObserver((mutationsList, observer) => {
    observer.disconnect();

    const responses = document.querySelectorAll(TEXT_CONTENT_SELECTOR);
    respCount = responses.length;
    responses.forEach((resp, i) => {
        processMessageBlock(resp, i);
    });
    updateChatUsagePill();
    updateGlobalUsagePill();

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
