import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchExhibitions, fetchMuseums } from '../api/masters';
import { emptyRating, fetchRatings, ratingKey } from '../api/ratings';
import {
  fetchLatestReviews,
  fetchReviewsByUser,
  fetchReviewsForTarget,
  saveReview,
  deleteReview,
  type ReviewInput,
} from '../api/reviews';
import { fetchMyClips, setClip } from '../api/clips';
import { useAuth } from '../contexts/AuthContext';
import type { ClipStatus, Rating, TargetType } from '../types';

const FIVE_MINUTES = 5 * 60 * 1000;

export const useMuseums = () =>
  useQuery({ queryKey: ['museums'], queryFn: fetchMuseums, staleTime: FIVE_MINUTES });

export const useExhibitions = () =>
  useQuery({ queryKey: ['exhibitions'], queryFn: fetchExhibitions, staleTime: FIVE_MINUTES });

export const useRatings = () =>
  useQuery({ queryKey: ['ratings'], queryFn: fetchRatings, staleTime: 60 * 1000 });

/** ratings が未取得でも 0 を返すので、呼び出し側で分岐しなくてよい */
export function useRatingOf(targetType: TargetType, targetId: string): Rating {
  const { data } = useRatings();
  return data?.[ratingKey(targetType, targetId)] ?? emptyRating;
}

export const useLatestReviews = (limit = 10) =>
  useQuery({ queryKey: ['reviews', 'latest', limit], queryFn: () => fetchLatestReviews(limit) });

export const useTargetReviews = (targetType: TargetType, targetId: string) =>
  useQuery({
    queryKey: ['reviews', targetType, targetId],
    queryFn: () => fetchReviewsForTarget(targetType, targetId),
    enabled: Boolean(targetId),
  });

export const useMyReviews = () => {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => fetchReviewsByUser(userId!),
    enabled: Boolean(userId),
  });
};

export const useMyClips = () => {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['clips', userId],
    queryFn: fetchMyClips,
    enabled: Boolean(userId),
  });
};

export function useClipStatus(targetType: TargetType, targetId: string): ClipStatus {
  const { data } = useMyClips();
  return data?.find((c) => c.targetType === targetType && c.targetId === targetId)?.status ?? 'none';
}

export function useSetClip() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetType,
      targetId,
      status,
    }: {
      targetType: TargetType;
      targetId: string;
      status: ClipStatus;
    }) => setClip(userId!, targetType, targetId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clips'] }),
  });
}

export function useSaveReview() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReviewInput) => saveReview(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}
