document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('actionButton');
  const status = document.getElementById('status');

  button?.addEventListener('click', () => {
    chrome.storage.local.set({ data: 'Hello from popup!' }, () => {
      if (status) {
        status.textContent = 'Data saved!';
      }
    });
  });
});
