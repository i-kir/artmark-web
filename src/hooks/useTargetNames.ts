import { useMemo } from 'react';
import { useExhibitions, useMuseums } from './queries';
import type { Review } from '../types';

/** レビュー一覧に「どの展覧会/美術館か」を添えるための名前解決 */
export function useTargetNames() {
  const museums = useMuseums();
  const exhibitions = useExhibitions();

  return useMemo(() => {
    const museumById = new Map((museums.data ?? []).map((m) => [m.id, m]));
    const exhibitionById = new Map((exhibitions.data ?? []).map((e) => [e.id, e]));

    return {
      museumById,
      exhibitionById,
      nameOf: (review: Review) =>
        review.targetType === 'museum'
          ? museumById.get(review.targetId)?.name
          : exhibitionById.get(review.targetId)?.title,
    };
  }, [museums.data, exhibitions.data]);
}
