export function formatRoleLabel(role: 'student' | 'professor' | 'system'): string {
  if (role === 'professor') return 'Professor';
  if (role === 'system') return 'System';
  return 'Student';
}

export function formatAuditActionLabel(action: string): string {
  return action
    .replaceAll('.', ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function summarizeEvidenceText(value: string, maxLength = 180): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'No evidence text.';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}
