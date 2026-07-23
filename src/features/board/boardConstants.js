export const BOARD_CATEGORIES = [
    { label: '자유 게시판', value: 'FREE' },
    { label: '장터 게시판', value: 'MARKET' },
    { label: '시터/돌봄', value: 'SITTER' },
];

export function getCategoryLabel(value) {
    return BOARD_CATEGORIES.find((category) => category.value === value)?.label
        ?? '커뮤니티';
}
