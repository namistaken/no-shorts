console.log('No Shorts: Content script loaded');

const SHORTS_SELECTORS = [
  'ytd-rich-shelf-renderer[is-shorts]',
  'ytd-reel-shelf-renderer',
  'ytd-shorts',
  '[is-shorts]',
  'ytd-mini-guide-entry-renderer a[title="Shorts"]',
  'ytd-guide-entry-renderer a[title="Shorts"]',
];

const updateBlockedCount = (count: number): void => {
  chrome.storage.local.get(['blockedCount'], (result) => {
    const currentCount = (result.blockedCount as number) || 0;
    const newCount = currentCount + count;
    chrome.storage.local.set({ blockedCount: newCount });
    console.log(`No Shorts: Total blocked count: ${newCount}`);
  });
};

const removeShortsElements = (): void => {
  let totalFound = 0;

  SHORTS_SELECTORS.forEach((selector) => {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    elements.forEach((el) => {
      if (!el.dataset.shortsRemoved) {
        el.style.display = 'none';
        el.dataset.shortsRemoved = 'true';
        totalFound++;
      }
    });
  });

  if (totalFound > 0) {
    console.log(`No Shorts: Removed ${totalFound} Shorts elements`);
    updateBlockedCount(totalFound);
  }
};

const init = (): void => {
  removeShortsElements();

  const observer = new MutationObserver(() => {
    removeShortsElements();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
