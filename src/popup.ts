document.addEventListener('DOMContentLoaded', () => {
  const countElement = document.getElementById('blockedCount');

  chrome.storage.local.get(['blockedCount'], (result) => {
    const count = (result.blockedCount as number) || 0;
    if (countElement) {
      countElement.textContent = count.toLocaleString();
    }
  });
});
