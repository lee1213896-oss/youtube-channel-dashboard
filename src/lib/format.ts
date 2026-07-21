export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export function formatCurrency(num: number): string {
  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return '$' + (num / 1000).toFixed(2) + 'K';
  }
  return '$' + num.toFixed(2);
}

export function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return sign + (num * 100).toFixed(1) + '%';
}
