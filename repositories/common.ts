export interface PageRequest {
  limit: number;
  cursor?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor?: string;
  totalEstimate?: number;
}

export interface RepositoryMutationResult {
  success: boolean;
  updatedAt: string;
}
