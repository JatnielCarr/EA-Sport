// =====================================================
// Skeleton Loaders - Loading Placeholders
// =====================================================

/**
 * Create a skeleton text line
 */
export function createSkeletonText(width = '100%') {
    return `<div class="skeleton skeleton-text" style="width: ${width}"></div>`;
}

/**
 * Create a skeleton paragraph (multiple lines)
 */
export function createSkeletonParagraph(lines = 3) {
    const widths = ['100%', '90%', '75%', '85%', '60%'];
    return Array.from({ length: lines }, (_, i) =>
        createSkeletonText(widths[i % widths.length])
    ).join('');
}

/**
 * Create a skeleton avatar/circle
 */
export function createSkeletonAvatar(size = '48px') {
    return `<div class="skeleton skeleton-avatar" style="width: ${size}; height: ${size}"></div>`;
}

/**
 * Create a skeleton image placeholder
 */
export function createSkeletonImage(height = '200px') {
    return `<div class="skeleton skeleton-image" style="height: ${height}"></div>`;
}

/**
 * Create a skeleton button
 */
export function createSkeletonButton(width = '120px') {
    return `<div class="skeleton skeleton-button" style="width: ${width}"></div>`;
}

/**
 * Create a skeleton tournament card
 */
export function createCardSkeleton() {
    return `
        <div class="skeleton-card tournament-card">
            <div class="skeleton skeleton-banner"></div>
            <div class="skeleton-content">
                <div class="skeleton-row">
                    ${createSkeletonText('30%')}
                </div>
                ${createSkeletonText('80%')}
                <div class="skeleton-meta">
                    ${createSkeletonText('40%')}
                    ${createSkeletonText('30%')}
                </div>
                <div class="skeleton-row" style="margin-top: 16px;">
                    ${createSkeletonText('25%')}
                </div>
                <div class="skeleton-footer">
                    ${createSkeletonButton()}
                </div>
            </div>
        </div>
    `;
}

/**
 * Create multiple tournament card skeletons
 */
export function createCardSkeletons(count = 6) {
    return `
        <div class="tournaments-grid">
            ${Array.from({ length: count }, () => createCardSkeleton()).join('')}
        </div>
    `;
}

/**
 * Create a skeleton list item
 */
export function createListItemSkeleton() {
    return `
        <div class="skeleton-list-item">
            ${createSkeletonAvatar('40px')}
            <div class="skeleton-list-content">
                ${createSkeletonText('60%')}
                ${createSkeletonText('40%')}
            </div>
        </div>
    `;
}

/**
 * Create multiple list item skeletons
 */
export function createListSkeleton(count = 5) {
    return `
        <div class="skeleton-list">
            ${Array.from({ length: count }, () => createListItemSkeleton()).join('')}
        </div>
    `;
}

/**
 * Create a skeleton profile page
 */
export function createProfileSkeleton() {
    return `
        <div class="skeleton-profile">
            <div class="skeleton-profile-header">
                ${createSkeletonAvatar('120px')}
                <div class="skeleton-profile-info">
                    ${createSkeletonText('40%')}
                    ${createSkeletonText('25%')}
                    ${createSkeletonText('60%')}
                </div>
            </div>
            <div class="skeleton-stats-grid">
                ${Array.from({ length: 4 }, () => `
                    <div class="skeleton-stat-card">
                        ${createSkeletonText('50%')}
                        ${createSkeletonText('30%')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Create a skeleton match card
 */
export function createMatchSkeleton() {
    return `
        <div class="skeleton-match">
            <div class="skeleton-match-teams">
                <div class="skeleton-team">
                    ${createSkeletonAvatar('50px')}
                    ${createSkeletonText('60%')}
                </div>
                <div class="skeleton-vs">vs</div>
                <div class="skeleton-team">
                    ${createSkeletonAvatar('50px')}
                    ${createSkeletonText('60%')}
                </div>
            </div>
            <div class="skeleton-match-info">
                ${createSkeletonText('40%')}
                ${createSkeletonText('30%')}
            </div>
        </div>
    `;
}

/**
 * Create multiple match skeletons
 */
export function createMatchesSkeleton(count = 4) {
    return `
        <div class="skeleton-matches">
            ${Array.from({ length: count }, () => createMatchSkeleton()).join('')}
        </div>
    `;
}

/**
 * Create a skeleton table
 */
export function createTableSkeleton(rows = 5, cols = 4) {
    const headerRow = `
        <div class="skeleton-table-row skeleton-table-header">
            ${Array.from({ length: cols }, () => createSkeletonText('80%')).join('')}
        </div>
    `;

    const bodyRows = Array.from({ length: rows }, () => `
        <div class="skeleton-table-row">
            ${Array.from({ length: cols }, (_, i) =>
        createSkeletonText(i === 0 ? '90%' : `${60 + Math.random() * 30}%`)
    ).join('')}
        </div>
    `).join('');

    return `
        <div class="skeleton-table">
            ${headerRow}
            ${bodyRows}
        </div>
    `;
}

/**
 * Show skeleton in a container
 */
export function showSkeleton(container, type = 'cards', options = {}) {
    const skeletons = {
        cards: () => createCardSkeletons(options.count || 6),
        list: () => createListSkeleton(options.count || 5),
        profile: () => createProfileSkeleton(),
        matches: () => createMatchesSkeleton(options.count || 4),
        table: () => createTableSkeleton(options.rows || 5, options.cols || 4)
    };

    const generator = skeletons[type] || skeletons.cards;
    container.innerHTML = generator();
}

export default {
    createSkeletonText,
    createSkeletonParagraph,
    createSkeletonAvatar,
    createSkeletonImage,
    createSkeletonButton,
    createCardSkeleton,
    createCardSkeletons,
    createListItemSkeleton,
    createListSkeleton,
    createProfileSkeleton,
    createMatchSkeleton,
    createMatchesSkeleton,
    createTableSkeleton,
    showSkeleton
};
