export const productPlaceholder = (seed: string): string => {
  const colors = [
    'linear-gradient(135deg, #eef3ff 0%, #dbe7ff 100%)',
    'linear-gradient(135deg, #f2eeff 0%, #e4daff 100%)',
    'linear-gradient(135deg, #e8f7fb 0%, #d3eef7 100%)',
    'linear-gradient(135deg, #eef2f7 0%, #e0e7f0 100%)',
    'linear-gradient(135deg, #eaf6ef 0%, #d7ecdf 100%)',
    'linear-gradient(135deg, #fdf3ec 0%, #f6e3d4 100%)',
  ];

  if (!seed) {
    return colors[0];
  }

  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return colors[Math.abs(hash) % colors.length];
};

export const initials = (name: string): string => {
  if (!name || !name.trim()) {
    return 'QC';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};
