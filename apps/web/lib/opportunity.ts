export function formatOpportunityLabel(id: string, score: number): string {
  const normalized = Math.max(0, Math.min(score, 1));
  return `${id} · score ${Math.round(normalized * 100)}%`;
}
