# Firefox Newtab Layout Playground

A visual tool for designing and generating Firefox Newtab card section layouts. Drag and drop cards to create custom responsive layouts and automatically generate the corresponding configuration objects.

## Features

- **Visual Layout Builder**: Drag and drop cards to design layouts
- **Three Card Sizes**: Small (1×1), Medium (2×1), and Large (2×2) cards
- **Responsive Breakpoints**: Design for all 4 Firefox breakpoints (1, 2, 3, and 4 columns)
- **Card Options**: Configure hasExcerpt and hasAd (SPOC) properties
- **Card Reordering**: Drag cards within the grid to rearrange visual positions
- **Live Preview**: See your layout with proper grid sizing
- **Code Generation**: Automatically generate layout configuration objects
- **Two Output Modes**:
  - Current breakpoint only
  - All breakpoints combined (full layout object)
- **Copy to Clipboard**: One-click copy of generated code

## Getting Started

### Running Locally

1. Clone or navigate to this repository:
   ```bash
   cd ~/repos/layout-playground
   ```

2. Open `index.html` in your web browser:
   ```bash
   open index.html
   ```

   Or use a local server (recommended):
   ```bash
   # Using Python
   python3 -m http.server 8000

   # Using Node.js
   npx serve
   ```

3. Navigate to `http://localhost:8000` in your browser

## How to Use

### 1. Select Card Options

In the left sidebar, configure default options for cards you're about to add:
- **Show Excerpt**: Whether cards should display article descriptions
- **Is Sponsored (SPOC)**: Mark cards as sponsored content (ads)

### 2. Choose a Breakpoint

Click on one of the 4 breakpoint tabs to design for specific screen sizes:
- **4 Columns** (≥1374px) - Wide desktop
- **3 Columns** (≥1122px) - Desktop
- **2 Columns** (≥724px) - Tablet
- **1 Column** (Mobile) - Mobile phones

### 3. Build Your Layout

Drag card sizes from the palette into the grid:
- **Small Card**: Horizontal layout, 1 row × 1 column
- **Medium Card**: Vertical layout, 2 rows × 1 column
- **Large Card**: Hero layout, 2 rows × 2 columns

### 4. Rearrange Cards

- Drag cards within the grid to reorder them
- The array order determines visual positioning (CSS `order` property)
- Position numbers update automatically

### 5. Remove Cards

- Hover over a card and click the × button to remove it

### 6. Generate Code

Click **"Generate Layout Code"** to see the configuration object in the right panel.

#### Output Modes

**Current Breakpoint** - Generates a single responsive layout:
```json
{
  "columnCount": 4,
  "tiles": [
    {
      "size": "medium",
      "position": 0,
      "hasAd": false,
      "hasExcerpt": true
    }
  ]
}
```

**All Breakpoints** - Generates the complete layout object:
```json
{
  "name": "custom-layout",
  "responsiveLayouts": [
    {
      "columnCount": 4,
      "tiles": [...]
    },
    {
      "columnCount": 3,
      "tiles": [...]
    }
  ]
}
```

### 7. Copy and Use

Click **"Copy to Clipboard"** and paste the configuration into Firefox's `SectionsLayoutManager.sys.mjs`.

## Understanding Layout Properties

### Card Sizes

- **`small`**: 1×1 grid, horizontal layout (image left, content right)
- **`medium`**: 2×1 grid, vertical layout (image top, content bottom)
- **`large`**: 2×2 grid, hero card (spans 2 columns)

### Tile Properties

Each tile in the layout has these properties:

- **`size`** (string): Card size - "small", "medium", or "large"
- **`position`** (number): Content position in the data array (0-indexed)
- **`hasAd`** (boolean): Whether this position shows sponsored content (SPOC)
- **`hasExcerpt`** (boolean): Whether to display the article excerpt

### Important Constraints

⚠️ **All breakpoints must have the same number of tiles**

When creating layouts for multiple breakpoints, ensure each `responsiveLayouts` entry has the same tile count. This is required by Firefox's rendering logic.

## Examples

### Example 1: Simple 4-Card Layout

Design a layout with 4 medium cards at the 4-column breakpoint:

1. Select "4 Columns" tab
2. Drag 4 medium cards into the grid
3. Generate code
4. Copy to clipboard

Result:
```json
{
  "columnCount": 4,
  "tiles": [
    { "size": "medium", "position": 0, "hasAd": false, "hasExcerpt": true },
    { "size": "medium", "position": 1, "hasAd": false, "hasExcerpt": true },
    { "size": "medium", "position": 2, "hasAd": false, "hasExcerpt": true },
    { "size": "medium", "position": 3, "hasAd": false, "hasExcerpt": true }
  ]
}
```

### Example 2: Layout with Ads

Create a layout with 2 SPOCs (ads):

1. Uncheck "Show Excerpt", check "Is Sponsored"
2. Drag a medium card (this will be SPOC 1)
3. Uncheck "Is Sponsored"
4. Drag 2 more medium cards
5. Check "Is Sponsored" again
6. Drag another medium card (this will be SPOC 2)

### Example 3: Multi-Breakpoint Layout

Design for all breakpoints:

1. Design 4-column layout (8 cards)
2. Switch to "3 Columns" tab
3. Design 3-column layout (8 cards - must match!)
4. Repeat for 2-column and 1-column
5. Switch output mode to "All Breakpoints"
6. Generate and copy complete layout object

## Tips

- **Start with the widest breakpoint** (4 columns) and work down
- **Keep card counts consistent** across all breakpoints
- **Use small cards strategically** at narrower breakpoints to fit more content
- **Position values should match** across breakpoints for consistency
- **Visual order can vary** between breakpoints (array order determines this)

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive grid system
- `script.js` - Drag-and-drop logic and code generation
- `README.md` - This documentation

## Browser Compatibility

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

To contribute or report issues:

1. Create a branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Related Documentation

For detailed information about Firefox's layout system, see:
- [CardSectionLayoutSystem.md](../CardSectionLayoutSystem.md) - Comprehensive documentation
- Firefox source: `browser/extensions/newtab/lib/SectionsLayoutManager.sys.mjs`

## License

This tool is for internal Firefox development. Follow Mozilla's standard licensing practices.
