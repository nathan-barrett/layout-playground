// State management
const state = {
    currentColumns: 4,
    layouts: {
        1: [],
        2: [],
        3: [],
        4: []
    },
    options: {
        hasExcerpt: true,
        hasAd: false
    },
    outputMode: 'current' // 'current' or 'all'
};

// DOM elements
const layoutGrid = document.getElementById('layoutGrid');
const codeOutput = document.getElementById('codeOutput');
const tabButtons = document.querySelectorAll('.tab-btn');
const outputTabs = document.querySelectorAll('.output-tab');
const clearBtn = document.getElementById('clearLayout');
const copyBtn = document.getElementById('copyCode');
const downloadCodeBtn = document.getElementById('downloadCode');
const hasExcerptCheckbox = document.getElementById('hasExcerpt');
const hasAdCheckbox = document.getElementById('hasAd');
const paletteCards = document.querySelectorAll('.palette-card');
const validationMessage = document.getElementById('validationMessage');
const outputValidationMessage = document.getElementById('outputValidationMessage');

// Initialize
function init() {
    setupDragAndDrop();
    setupTabs();
    setupOutputTabs();
    setupButtons();
    setupCheckboxes();
    updateValidationDisplay();
    updateCodeOutput();
}

// Drag and Drop Setup
function setupDragAndDrop() {
    // Palette cards
    paletteCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    // Layout grid
    layoutGrid.addEventListener('dragover', handleDragOver);
    layoutGrid.addEventListener('drop', handleDrop);
    layoutGrid.addEventListener('dragleave', handleDragLeave);
}

function handleDragStart(e) {
    const size = e.target.dataset.size;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('cardSize', size);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    if (e.target === layoutGrid || e.target.classList.contains('grid-info')) {
        e.preventDefault();
        const types = e.dataTransfer.types;
        if (types.includes('cardsize')) {
            e.dataTransfer.dropEffect = 'copy';
            layoutGrid.classList.add('drag-over');
        }
    }
}

function handleDragLeave(e) {
    if (e.target === layoutGrid) {
        layoutGrid.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    if (e.target === layoutGrid || e.target.classList.contains('grid-info')) {
        e.preventDefault();
        layoutGrid.classList.remove('drag-over');

        const size = e.dataTransfer.getData('cardSize');
        if (size) {
            addCard(size);
        }
    }
}

// Calculate rows used by a layout and check for blank spots
function calculateRowsUsed(columnCount, checkForBlanks = false) {
    const layout = state.layouts[columnCount];
    if (layout.length === 0) return 0;

    const grid = [];

    layout.forEach((card, cardIndex) => {
        let placed = false;
        const cardRows = card.size === 'small' ? 1 : 2;
        const cardCols = card.size === 'large' ? 2 : 1;

        for (let row = 0; row < 100 && !placed; row++) {
            for (let col = 0; col <= columnCount - cardCols; col++) {
                let canPlace = true;

                for (let r = row; r < row + cardRows; r++) {
                    for (let c = col; c < col + cardCols; c++) {
                        if (!grid[r]) grid[r] = [];
                        if (grid[r][c] !== undefined) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }

                if (canPlace) {
                    for (let r = row; r < row + cardRows; r++) {
                        for (let c = col; c < col + cardCols; c++) {
                            if (!grid[r]) grid[r] = [];
                            grid[r][c] = cardIndex;
                        }
                    }
                    placed = true;
                    break;
                }
            }
        }
    });

    const cssGridRows = grid.length;
    const logicalRows = Math.ceil(cssGridRows / 2);

    if (checkForBlanks && grid.length > 0) {
        for (let r = 0; r < grid.length; r++) {
            if (!grid[r]) continue;

            let hasContent = false;
            for (let c = 0; c < columnCount; c++) {
                if (grid[r][c] !== undefined) {
                    hasContent = true;
                    break;
                }
            }

            if (hasContent) {
                for (let c = 0; c < columnCount; c++) {
                    if (grid[r][c] === undefined) {
                        return { rows: logicalRows, hasBlankSpots: true, blankRow: r, blankCol: c };
                    }
                }
            }
        }
    }

    return checkForBlanks ? { rows: logicalRows, hasBlankSpots: false } : logicalRows;
}

// Validate layout for blank spots
function validateLayout(columnCount) {
    const result = calculateRowsUsed(columnCount, true);
    if (typeof result === 'object') {
        return result;
    }
    return { rows: result, hasBlankSpots: false };
}

// Update validation display
function updateValidationDisplay() {
    const validation = validateLayout(state.currentColumns);
    const errors = [];

    if (validation.hasBlankSpots) {
        errors.push(`Layout has blank spots (row ${validation.blankRow + 1}, col ${validation.blankCol + 1}). This creates gaps in the grid.`);
    }

    if (errors.length > 0) {
        validationMessage.textContent = errors.join(' ');
        validationMessage.className = 'validation-message error';
        validationMessage.style.display = 'block';

        // Disable output buttons immediately when there are blank spots
        copyBtn.disabled = true;
        downloadCodeBtn.disabled = true;
    } else {
        validationMessage.style.display = 'none';
    }

    // Always update code output (it will handle button states for other validations)
    updateCodeOutput();
}

// Add card to layout
function addCard(size) {
    // Find the current card count (which equals the next position)
    const currentCardCount = state.layouts[state.currentColumns].length;
    const position = currentCardCount;

    [1, 2, 3, 4].forEach(cols => {
        let cardSize;
        if (cols === state.currentColumns) {
            cardSize = size;
        } else if (cols === 1 && size === 'large') {
            // Large cards can't fit in 1 column, convert to medium
            cardSize = 'medium';
        } else {
            cardSize = 'medium';
        }

        // Only medium cards can be SPOCs
        const canBeAd = cardSize === 'medium';

        state.layouts[cols].push({
            size: cardSize,
            position: position,
            hasAd: canBeAd ? state.options.hasAd : false,
            hasExcerpt: state.options.hasExcerpt
        });
    });

    renderLayout();
    updateValidationDisplay();
}

// Change card size
function changeCardSize(index, newSize) {
    // Prevent large cards in 1-column layout
    if (state.currentColumns === 1 && newSize === 'large') {
        return;
    }

    const currentLayout = state.layouts[state.currentColumns];
    currentLayout[index].size = newSize;

    // If changing to non-medium size, remove SPOC flag
    if (newSize !== 'medium' && currentLayout[index].hasAd) {
        currentLayout[index].hasAd = false;
    }

    renderLayout();
    updateValidationDisplay();
}

// Remove card from layout
function removeCard(index) {
    const currentLayout = state.layouts[state.currentColumns];
    const removedPosition = currentLayout[index].position;

    // Remove the card from ALL breakpoints
    [1, 2, 3, 4].forEach(cols => {
        // Find and remove the card with this position
        const cardIndex = state.layouts[cols].findIndex(card => card.position === removedPosition);
        if (cardIndex !== -1) {
            state.layouts[cols].splice(cardIndex, 1);
        }

        // Decrement position for all cards after the removed one
        state.layouts[cols].forEach(card => {
            if (card.position > removedPosition) {
                card.position--;
            }
        });
    });

    renderLayout();
    updateValidationDisplay();
}

// Render layout
function renderLayout() {
    const currentLayout = state.layouts[state.currentColumns];
    layoutGrid.innerHTML = '';

    if (currentLayout.length === 0) {
        const info = document.createElement('div');
        info.className = 'grid-info';
        info.innerHTML = '<p>Drop cards here to build your layout</p>';
        layoutGrid.appendChild(info);
        return;
    }

    currentLayout.forEach((card, index) => {
        const cardEl = createCardElement(card, index);
        layoutGrid.appendChild(cardEl);
    });
}

// Create card element
function createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = `dropped-card ${card.size}`;
    cardEl.draggable = true;
    cardEl.dataset.index = index;

    const largeDisabled = state.currentColumns === 1 ? 'disabled' : '';

    cardEl.innerHTML = `
        <div class="card-header">
            <select class="card-size-selector" data-index="${index}">
                <option value="small" ${card.size === 'small' ? 'selected' : ''}>Small</option>
                <option value="medium" ${card.size === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="large" ${card.size === 'large' ? 'selected' : ''} ${largeDisabled}>Large</option>
            </select>
            <div class="card-positions">
                <span class="card-position">Position ${card.position}</span>
                <span class="card-visual-position">Visual ${index}</span>
            </div>
        </div>
        <div class="card-badges">
            ${card.hasAd ? '<span class="badge ad">SPOC</span>' : ''}
            ${card.hasExcerpt ? '<span class="badge excerpt">Excerpt</span>' : ''}
        </div>
        <button class="card-remove" onclick="removeCard(${index})">×</button>
    `;

    // Size selector change handler
    const sizeSelector = cardEl.querySelector('.card-size-selector');
    sizeSelector.addEventListener('change', (e) => {
        e.stopPropagation();
        changeCardSize(index, e.target.value);
    });

    // Prevent drag when interacting with selector or remove button
    const removeBtn = cardEl.querySelector('.card-remove');

    sizeSelector.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        cardEl.draggable = false;
    });
    sizeSelector.addEventListener('mouseup', () => {
        setTimeout(() => {
            cardEl.draggable = true;
        }, 0);
    });

    removeBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    // Allow reordering
    cardEl.addEventListener('dragstart', handleCardDragStart);
    cardEl.addEventListener('dragover', handleCardDragOver);
    cardEl.addEventListener('dragleave', handleCardDragLeave);
    cardEl.addEventListener('drop', handleCardDrop);
    cardEl.addEventListener('dragend', handleCardDragEnd);

    return cardEl;
}

// Card reordering
let draggedCardIndex = null;
let draggedCardElement = null;

function handleCardDragStart(e) {
    const cardEl = e.currentTarget;
    draggedCardIndex = parseInt(cardEl.dataset.index);
    draggedCardElement = cardEl;
    cardEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedCardIndex);
}

function handleCardDragEnd() {
    if (draggedCardElement) {
        draggedCardElement.classList.remove('dragging');
    }

    document.querySelectorAll('.dropped-card').forEach(card => {
        card.classList.remove('drag-over');
    });

    draggedCardIndex = null;
    draggedCardElement = null;
}

function handleCardDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetCard = e.currentTarget;
    if (targetCard && targetCard !== draggedCardElement) {
        targetCard.classList.add('drag-over');
    }
}

function handleCardDragLeave(e) {
    const targetCard = e.currentTarget;
    if (targetCard) {
        targetCard.classList.remove('drag-over');
    }
}

function handleCardDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const dropTarget = e.currentTarget;
    dropTarget.classList.remove('drag-over');

    const dropIndex = parseInt(dropTarget.dataset.index);

    if (draggedCardIndex !== null && draggedCardIndex !== dropIndex) {
        const currentLayout = state.layouts[state.currentColumns];
        const draggedCard = currentLayout[draggedCardIndex];

        currentLayout.splice(draggedCardIndex, 1);
        currentLayout.splice(dropIndex, 0, draggedCard);

        renderLayout();
        updateCodeOutput();
    }
}

// Tab switching
function setupTabs() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const columns = parseInt(btn.dataset.columns);
            switchBreakpoint(columns);
        });
    });
}

function switchBreakpoint(columns) {
    state.currentColumns = columns;

    // Update active tab
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.columns) === columns);
    });

    // Update grid columns
    layoutGrid.dataset.columns = columns;

    renderLayout();
    updateValidationDisplay();
}

// Output tabs
function setupOutputTabs() {
    outputTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.output;
            state.outputMode = mode;

            outputTabs.forEach(t => {
                t.classList.toggle('active', t.dataset.output === mode);
            });

            updateCodeOutput();
        });
    });
}

// Update code output
function updateCodeOutput() {
    let output;
    const validationErrors = [];

    if (state.outputMode === 'current') {
        const currentLayout = state.layouts[state.currentColumns];

        // Check current breakpoint for blank spots
        const validation = validateLayout(state.currentColumns);
        if (validation.hasBlankSpots) {
            validationErrors.push(
                `⚠️ Current breakpoint has blank spots (row ${validation.blankRow + 1}, col ${validation.blankCol + 1})`
            );
        }

        // Check all breakpoints for tile count consistency
        const tileCounts = [4, 3, 2, 1].map(cols => state.layouts[cols].length);
        const uniqueCounts = [...new Set(tileCounts)];
        if (uniqueCounts.length > 1) {
            validationErrors.push(
                `⚠️ All breakpoints must have the same number of tiles.\n` +
                `Current counts: ${[4, 3, 2, 1].map(cols => `${cols}col=${state.layouts[cols].length}`).join(', ')}`
            );
        }

        // Check all breakpoints for position consistency
        const allPositions = {};
        [4, 3, 2, 1].forEach(cols => {
            const positions = state.layouts[cols].map(card => card.position).sort((a, b) => a - b);
            allPositions[cols] = positions;
        });
        const referencePositions = JSON.stringify(allPositions[4]);
        const mismatchedBreakpoints = [3, 2, 1].filter(
            cols => JSON.stringify(allPositions[cols]) !== referencePositions
        );
        if (mismatchedBreakpoints.length > 0) {
            validationErrors.push(
                `⚠️ Position values must be consistent across all breakpoints.\n` +
                `Mismatched breakpoints: ${mismatchedBreakpoints.map(c => `${c}col`).join(', ')}`
            );
        }

        // Check all breakpoints for blank spots
        const blankSpotViolations = [];
        [4, 3, 2, 1].forEach(cols => {
            const validation = validateLayout(cols);
            if (validation.hasBlankSpots) {
                blankSpotViolations.push(`${cols}col`);
            }
        });
        if (blankSpotViolations.length > 0) {
            validationErrors.push(
                `⚠️ Blank spots detected in breakpoints: ${blankSpotViolations.join(', ')}`
            );
        }

        // Check that only medium cards have hasAd: true
        const invalidSpocViolations = [];
        [4, 3, 2, 1].forEach(cols => {
            state.layouts[cols].forEach(card => {
                if (card.hasAd && card.size !== 'medium') {
                    invalidSpocViolations.push(`${cols}col position ${card.position}`);
                }
            });
        });
        if (invalidSpocViolations.length > 0) {
            validationErrors.push(
                `⚠️ Only medium cards can be SPOCs: ${invalidSpocViolations.join(', ')}`
            );
        }

        output = {
            columnCount: state.currentColumns,
            tiles: currentLayout.map(card => ({
                size: card.size,
                position: card.position,
                hasAd: card.hasAd,
                hasExcerpt: card.hasExcerpt
            }))
        };

        if (validationErrors.length > 0) {
            output._validation_errors = validationErrors;
        }
    } else {
        const tileCounts = [4, 3, 2, 1].map(cols => state.layouts[cols].length);
        const uniqueCounts = [...new Set(tileCounts)];

        if (uniqueCounts.length > 1) {
            validationErrors.push(
                `⚠️ All breakpoints must have the same number of tiles.\n` +
                `Current counts: ${[4, 3, 2, 1].map(cols => `${cols}col=${state.layouts[cols].length}`).join(', ')}`
            );
        }

        const allPositions = {};
        [4, 3, 2, 1].forEach(cols => {
            const positions = state.layouts[cols].map(card => card.position).sort((a, b) => a - b);
            allPositions[cols] = positions;
        });

        const referencePositions = JSON.stringify(allPositions[4]);
        const mismatchedBreakpoints = [3, 2, 1].filter(
            cols => JSON.stringify(allPositions[cols]) !== referencePositions
        );
        if (mismatchedBreakpoints.length > 0) {
            validationErrors.push(
                `⚠️ Position values must be consistent across all breakpoints.\n` +
                `Mismatched breakpoints: ${mismatchedBreakpoints.map(c => `${c}col`).join(', ')}`
            );
        }

        const blankSpotViolations = [];
        [4, 3, 2, 1].forEach(cols => {
            const validation = validateLayout(cols);

            if (validation.hasBlankSpots) {
                blankSpotViolations.push(`${cols}col has blank spots`);
            }
        });

        if (blankSpotViolations.length > 0) {
            validationErrors.push(
                `⚠️ Blank spots detected in some breakpoints:\n` +
                blankSpotViolations.join(', ')
            );
        }

        // Check that only medium cards have hasAd: true
        const invalidSpocViolations = [];
        [4, 3, 2, 1].forEach(cols => {
            state.layouts[cols].forEach(card => {
                if (card.hasAd && card.size !== 'medium') {
                    invalidSpocViolations.push(`${cols}col position ${card.position}`);
                }
            });
        });
        if (invalidSpocViolations.length > 0) {
            validationErrors.push(
                `⚠️ Only medium cards can be SPOCs:\n${invalidSpocViolations.join(', ')}`
            );
        }

        const responsiveLayouts = [];
        [4, 3, 2, 1].forEach(cols => {
            responsiveLayouts.push({
                columnCount: cols,
                tiles: state.layouts[cols].map(card => ({
                    size: card.size,
                    position: card.position,
                    hasAd: card.hasAd,
                    hasExcerpt: card.hasExcerpt
                }))
            });
        });

        output = {
            name: "custom-layout",
            responsiveLayouts: responsiveLayouts
        };

        if (validationErrors.length > 0) {
            output._validation_errors = validationErrors;
        }
    }

    let codeText;
    if (state.outputMode === 'python') {
        codeText = generatePythonCode(validationErrors);
    } else {
        codeText = JSON.stringify(output, null, 2);
    }

    codeOutput.querySelector('code').textContent = codeText;

    // Update output validation message and button states
    if (validationErrors.length > 0) {
        outputValidationMessage.textContent = validationErrors.join('\n');
        outputValidationMessage.className = 'validation-message error';
        outputValidationMessage.style.display = 'block';
        copyBtn.disabled = true;
        downloadCodeBtn.disabled = true;
    } else {
        outputValidationMessage.style.display = 'none';
        copyBtn.disabled = false;
        downloadCodeBtn.disabled = false;
    }
}

function generatePythonCode(validationErrors) {
    const layoutName = "layout_custom";

    let python = `${layoutName} = Layout(\n`;
    python += `    name="custom-layout",\n`;
    python += `    responsiveLayouts=[\n`;

    [4, 3, 2, 1].forEach((cols, colIndex) => {
        python += `        ResponsiveLayout(\n`;
        python += `            columnCount=${cols},\n`;
        python += `            tiles=[\n`;

        state.layouts[cols].forEach((card, cardIndex) => {
            const sizeEnum = `TileSize.${card.size.toUpperCase()}`;
            python += `                Tile(size=${sizeEnum}, position=${card.position}, hasAd=${card.hasAd ? 'True' : 'False'}, hasExcerpt=${card.hasExcerpt ? 'True' : 'False'})`;
            if (cardIndex < state.layouts[cols].length - 1) {
                python += ',';
            }
            python += '\n';
        });

        python += `            ],\n`;
        python += `        )`;
        if (colIndex < 3) {
            python += ',';
        }
        python += '\n';
    });

    python += `    ],\n`;
    python += `)\n`;

    if (validationErrors.length > 0) {
        python = `# VALIDATION ERRORS:\n${validationErrors.map(e => `# ${e}`).join('\n')}\n\n` + python;
    }

    return python;
}

// Button handlers
function setupButtons() {
    clearBtn.addEventListener('click', () => {
        if (confirm('Clear the current breakpoint layout?')) {
            state.layouts[state.currentColumns] = [];
            renderLayout();
            updateValidationDisplay();
        }
    });

    downloadCodeBtn.addEventListener('click', () => {
        const code = codeOutput.querySelector('code').textContent;
        let filename, mimeType;

        if (state.outputMode === 'python') {
            filename = 'layout_custom.py';
            mimeType = 'text/x-python';
        } else {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            filename = `custom-layout-${timestamp}.json`;
            mimeType = 'application/json';
        }

        const blob = new Blob([code], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    copyBtn.addEventListener('click', () => {
        const code = codeOutput.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    });
}

// Checkbox handlers
function setupCheckboxes() {
    hasExcerptCheckbox.addEventListener('change', (e) => {
        state.options.hasExcerpt = e.target.checked;
    });

    hasAdCheckbox.addEventListener('change', (e) => {
        state.options.hasAd = e.target.checked;
    });
}

// Make removeCard available globally
window.removeCard = removeCard;

// Initialize app
init();
