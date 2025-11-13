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
const generateBtn = document.getElementById('generateCode');
const clearBtn = document.getElementById('clearLayout');
const copyBtn = document.getElementById('copyCode');
const hasExcerptCheckbox = document.getElementById('hasExcerpt');
const hasAdCheckbox = document.getElementById('hasAd');
const paletteCards = document.querySelectorAll('.palette-card');

// Initialize
function init() {
    setupDragAndDrop();
    setupTabs();
    setupOutputTabs();
    setupButtons();
    setupCheckboxes();
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
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    layoutGrid.classList.add('drag-over');
}

function handleDragLeave(e) {
    if (e.target === layoutGrid) {
        layoutGrid.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    layoutGrid.classList.remove('drag-over');

    const size = e.dataTransfer.getData('cardSize');
    if (size) {
        addCard(size);
    }
}

// Add card to layout
function addCard(size) {
    const currentLayout = state.layouts[state.currentColumns];
    const position = currentLayout.length;

    const card = {
        size: size,
        position: position,
        hasAd: state.options.hasAd,
        hasExcerpt: state.options.hasExcerpt
    };

    currentLayout.push(card);
    renderLayout();
    updateCodeOutput();
}

// Remove card from layout
function removeCard(index) {
    const currentLayout = state.layouts[state.currentColumns];
    currentLayout.splice(index, 1);

    // Update positions
    currentLayout.forEach((card, idx) => {
        card.position = idx;
    });

    renderLayout();
    updateCodeOutput();
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

    cardEl.innerHTML = `
        <div class="card-header">
            <span class="card-size">${card.size.charAt(0).toUpperCase() + card.size.slice(1)}</span>
            <span class="card-position">Position ${card.position}</span>
        </div>
        <div class="card-badges">
            ${card.hasAd ? '<span class="badge ad">SPOC</span>' : ''}
            ${card.hasExcerpt ? '<span class="badge excerpt">Excerpt</span>' : ''}
        </div>
        <button class="card-remove" onclick="removeCard(${index})">×</button>
    `;

    // Allow reordering
    cardEl.addEventListener('dragstart', handleCardDragStart);
    cardEl.addEventListener('dragover', handleCardDragOver);
    cardEl.addEventListener('drop', handleCardDrop);

    return cardEl;
}

// Card reordering
let draggedCardIndex = null;

function handleCardDragStart(e) {
    draggedCardIndex = parseInt(e.target.dataset.index);
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleCardDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleCardDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const dropIndex = parseInt(e.currentTarget.dataset.index);

    if (draggedCardIndex !== null && draggedCardIndex !== dropIndex) {
        const currentLayout = state.layouts[state.currentColumns];
        const draggedCard = currentLayout[draggedCardIndex];

        // Reorder
        currentLayout.splice(draggedCardIndex, 1);
        currentLayout.splice(dropIndex, 0, draggedCard);

        // Update positions
        currentLayout.forEach((card, idx) => {
            card.position = idx;
        });

        renderLayout();
        updateCodeOutput();
    }

    draggedCardIndex = null;
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
    updateCodeOutput();
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

    if (state.outputMode === 'current') {
        const currentLayout = state.layouts[state.currentColumns];
        output = {
            columnCount: state.currentColumns,
            tiles: currentLayout.map(card => ({
                size: card.size,
                position: card.position,
                hasAd: card.hasAd,
                hasExcerpt: card.hasExcerpt
            }))
        };
    } else {
        // All breakpoints
        const responsiveLayouts = [];
        [4, 3, 2, 1].forEach(cols => {
            if (state.layouts[cols].length > 0) {
                responsiveLayouts.push({
                    columnCount: cols,
                    tiles: state.layouts[cols].map(card => ({
                        size: card.size,
                        position: card.position,
                        hasAd: card.hasAd,
                        hasExcerpt: card.hasExcerpt
                    }))
                });
            }
        });

        output = {
            name: "custom-layout",
            responsiveLayouts: responsiveLayouts
        };
    }

    codeOutput.querySelector('code').textContent = JSON.stringify(output, null, 2);
}

// Button handlers
function setupButtons() {
    generateBtn.addEventListener('click', () => {
        updateCodeOutput();
        // Scroll to output
        codeOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('Clear the current breakpoint layout?')) {
            state.layouts[state.currentColumns] = [];
            renderLayout();
            updateCodeOutput();
        }
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
