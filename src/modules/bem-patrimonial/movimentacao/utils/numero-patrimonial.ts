export function formatarNP(value: string) {
  return (value ?? '')
    .replaceAll(/\D/g, '')
    .slice(0, 13)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/(\.\d{9})(\d)$/, '$1-$2');
}
