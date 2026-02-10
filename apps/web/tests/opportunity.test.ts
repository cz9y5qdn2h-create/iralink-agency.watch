import { describe, expect, it } from 'vitest';

import { formatOpportunityLabel } from '../lib/opportunity';

describe('formatOpportunityLabel', () => {
  it('formats id and score percentage', () => {
    expect(formatOpportunityLabel('w_001', 0.91)).toBe('w_001 · score 91%');
  });

  it('caps score between 0 and 1', () => {
    expect(formatOpportunityLabel('w_001', 2)).toBe('w_001 · score 100%');
  });
});
