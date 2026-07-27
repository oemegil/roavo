/** Dense integer positions: 0..n-1 */

export function positionsForCount(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

export function assertPermutation(ids: string[], expectedIds: string[]): void {
  if (ids.length !== expectedIds.length) {
    throw new Error("Ordered ID list length mismatch.");
  }
  const expected = new Set(expectedIds);
  const seen = new Set<string>();
  for (const id of ids) {
    if (!expected.has(id) || seen.has(id)) {
      throw new Error("Ordered ID list is not a valid permutation.");
    }
    seen.add(id);
  }
}

export function insertAtPositions(
  orderedIds: string[],
  itemId: string,
  targetIndex: number,
): string[] {
  const without = orderedIds.filter((id) => id !== itemId);
  const index = Math.max(0, Math.min(targetIndex, without.length));
  return [...without.slice(0, index), itemId, ...without.slice(index)];
}
