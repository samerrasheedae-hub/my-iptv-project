import { Page, PageRequest } from '../common';

export function pageItems<T>(items: T[], page?: PageRequest): Page<T> {
  const limit = page?.limit ?? items.length;
  const offset = page?.cursor ? Number(page.cursor) : 0;
  const nextOffset = offset + limit;
  return {
    items: items.slice(offset, nextOffset),
    nextCursor: nextOffset < items.length ? String(nextOffset) : undefined,
    totalEstimate: items.length,
  };
}

export const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));
