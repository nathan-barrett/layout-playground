# Firefox Newtab Layout Playground

Visual tool for designing and generating Firefox Newtab card section layouts.

## Features

- Drag and drop cards to design layouts
- Three card sizes: Small (1×1), Medium (2×1), and Large (2×2)
- Design for all 4 Firefox breakpoints (1, 2, 3, and 4 columns)
- Configure hasExcerpt and hasAd (SPOC) properties
- Drag cards to reorder them
- Generate layout configuration objects
- Output for single breakpoint or all breakpoints

## Getting Started

### Running Locally

Open `index.html` in your browser, or use a local server:

```bash
python3 -m http.server 8000
# or
npx serve
```

## How to Use

1. Configure card options in the left sidebar (excerpt, SPOC)
2. Select a breakpoint tab (1-4 columns)
3. Drag cards from the palette into the grid
4. Rearrange cards by dragging them
5. Click "Generate Layout Code"
6. Copy the output

### Output Modes

**Current Breakpoint** - Single responsive layout object

**All Breakpoints** - Complete layout object with all breakpoints

Generated code can be pasted into `SectionsLayoutManager.sys.mjs`.

## Layout Properties

### Card Sizes

- `small`: 1×1 grid, horizontal layout
- `medium`: 2×1 grid, vertical layout
- `large`: 2×2 grid, hero card

### Tile Properties

- `size`: "small", "medium", or "large"
- `position`: Content position in the data array (0-indexed)
- `hasAd`: Whether this position shows sponsored content (SPOC)
- `hasExcerpt`: Whether to display the article excerpt

All breakpoints must have the same number of tiles.

## Tips

- Start with the widest breakpoint (4 columns) and work down
- Keep card counts consistent across all breakpoints
- Use small cards at narrower breakpoints to fit more content
- Position values should match across breakpoints for consistency

## Related Documentation

- [CardSectionLayoutSystem.md](../CardSectionLayoutSystem.md)
- Firefox source: `browser/extensions/newtab/lib/SectionsLayoutManager.sys.mjs`
