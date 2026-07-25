/**
 * 프로젝트에서 사용하는 반려견 크기 기준입니다.
 * 10kg은 중형견, 25kg은 중형견, 25kg 초과부터 대형견입니다.
 */
export const PET_SIZE_OPTIONS = [
  { label: '소형견 · 10kg 미만', value: 'SMALL' },
  { label: '중형견 · 10~25kg', value: 'MEDIUM' },
  { label: '대형견 · 25kg 초과', value: 'LARGE' },
];

export function getPetSizeByWeight(weight) {
  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) return '';
  if (numericWeight < 10) return 'SMALL';
  if (numericWeight <= 25) return 'MEDIUM';
  return 'LARGE';
}

export function getPetSizeLabel(size) {
  return PET_SIZE_OPTIONS.find((option) => option.value === size)?.label ?? '';
}
