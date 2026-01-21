# No Shorts

A Chrome extension that removes YouTube Shorts from your feed. Also includes a built-in Tetris game.

## Features

- Automatically removes YouTube Shorts from your feed
- Tracks total Shorts blocked
- Built-in Tetris game in the popup

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Open Chrome and go to `chrome://extensions`
5. Enable "Developer mode" (top right)
6. Click "Load unpacked" and select the `no-shorts` folder

## Development

```bash
npm run build      # Compile TypeScript
npm run typecheck  # Check types without building
npm run watch      # Watch mode for development
```

## How it works

The extension uses a content script that runs on YouTube pages. It detects Shorts-related elements (shelves, navigation links, etc.) and hides them from view. A MutationObserver ensures dynamically loaded content is also handled as you scroll.

## Tetris

Click the extension icon to open the popup and play Tetris!

**Controls:**
- ← → Move left/right
- ↑ Rotate
- ↓ Hard drop

## License

MIT
