console.log('No Shorts: Content script loaded');

const SHORTS_SELECTORS = [
  'ytd-rich-shelf-renderer[is-shorts]',
  'ytd-reel-shelf-renderer',
  'ytd-shorts',
  '[is-shorts]',
  'ytd-mini-guide-entry-renderer a[title="Shorts"]',
  'ytd-guide-entry-renderer a[title="Shorts"]',
];

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
