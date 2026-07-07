import { useXtreamRuntime } from '@/providers/XtreamRuntimeProvider';
import { XtreamCategory, XtreamContentKind } from '@/xtream/types';
import { useAsyncResource } from './useAsyncResource';

export interface XtreamCategoryGroup {
  kind: XtreamContentKind;
  title: string;
  categories: XtreamCategory[];
}

export interface XtreamCategoriesModel {
  groups: XtreamCategoryGroup[];
  totalCount: number;
}

const CATEGORY_LIMIT = Number.MAX_SAFE_INTEGER;

export function useXtreamCategories() {
  const { container, storedAccount, session, engineState } = useXtreamRuntime();
  const playlistId = session?.playlistId ?? storedAccount?.playlistId;

  return useAsyncResource<XtreamCategoriesModel>(async () => {
    if (!playlistId) {
      return { groups: [], totalCount: 0 };
    }

    const [live, movies, series] = await Promise.all([
      container.repository.listCategories({ playlistId, kind: 'live', limit: CATEGORY_LIMIT }),
      container.repository.listCategories({ playlistId, kind: 'movie', limit: CATEGORY_LIMIT }),
      container.repository.listCategories({ playlistId, kind: 'series', limit: CATEGORY_LIMIT }),
    ]);

    const groups: XtreamCategoryGroup[] = [
      { kind: 'live', title: 'Live TV Categories', categories: live.items },
      { kind: 'movie', title: 'Movie Categories', categories: movies.items },
      { kind: 'series', title: 'Series Categories', categories: series.items },
    ];

    return {
      groups,
      totalCount: groups.reduce((total, group) => total + group.categories.length, 0),
    };
  }, [playlistId, container, engineState.updatedAt]);
}
