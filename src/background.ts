chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_DATA') {
    chrome.storage.local.get(['data'], (result) => {
      sendResponse({ data: result.data });
    });
    return true;
  }
});
