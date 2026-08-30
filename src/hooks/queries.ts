import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchExhibitions, fetchMuseums } from '../api/masters';
import { emptyRating, fetchRatings, ratingKey } from '../api/ratings';
import {
  fetchLatestReviews,
  fetchReviewsByTag,
  fetchReviewsByUser,
  fetchReviewsForTarget,
  fetchTimelineReviews,
  saveReview,
  deleteReview,
  type ReviewInput,
} from '../api/reviews';
import { fetchMyClips, setClip } from '../api/clips';
import {
  fetchProfileByHandle,
  fetchProfileStats,
  searchProfiles,
  updateProfile,
  type ProfileInput,
} from '../api/profiles';
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchFollowers,
  fetchFollowing,
  fetchFollowingIds,
  fetchMyLikedReviewIds,
  setFollow,
  setLike,
} from '../api/social';
import {
  createExhibition,
  updateExhibition,
  type ExhibitionInput,
} from '../api/exhibitionsAdmin';
import { submitReport, type ReportReason, type ReportTarget } from '../api/reports';
import { useAuth } from '../contexts/AuthContext';
import type { ClipStatus, Rating, TargetType } from '../types';

const FIVE_MINUTES = 5 * 60 * 1000;

// ---------- マスタ ----------

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

// ---------- レビュー ----------

export const useLatestReviews = (limit = 10) =>
  useQuery({ queryKey: ['reviews', 'latest', limit], queryFn: () => fetchLatestReviews(limit) });

export const useTargetReviews = (targetType: TargetType, targetId: string) =>
  useQuery({
    queryKey: ['reviews', targetType, targetId],
    queryFn: () => fetchReviewsForTarget(targetType, targetId),
    enabled: Boolean(targetId),
  });

export const useReviewsByUser = (userId: string | null | undefined) =>
  useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => fetchReviewsByUser(userId!),
    enabled: Boolean(userId),
  });

export const useMyReviews = () => {
  const { userId } = useAuth();
  return useReviewsByUser(userId);
};

export const useReviewsByTag = (tag: string) =>
  useQuery({ queryKey: ['reviews', 'tag', tag], queryFn: () => fetchReviewsByTag(tag), enabled: Boolean(tag) });

export const useTimeline = () => {
  const { userId } = useAuth();
  const following = useFollowingIds();
  return useQuery({
    queryKey: ['reviews', 'timeline', userId, following.data],
    queryFn: () => fetchTimelineReviews(following.data ?? []),
    enabled: Boolean(userId) && following.isSuccess,
  });
};

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

// ---------- クリップ ----------

export const useMyClips = () => {
  const { userId } = useAuth();
  return useQuery({ queryKey: ['clips', userId], queryFn: fetchMyClips, enabled: Boolean(userId) });
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

// ---------- プロフィール ----------

export const useProfileByHandle = (handle: string) =>
  useQuery({
    queryKey: ['profile', handle],
    queryFn: () => fetchProfileByHandle(handle),
    enabled: Boolean(handle),
  });

export const useProfileStats = (userId: string | null | undefined) =>
  useQuery({
    queryKey: ['profileStats', userId],
    queryFn: () => fetchProfileStats(userId!),
    enabled: Boolean(userId),
  });

export const useSearchProfiles = (term: string) =>
  useQuery({ queryKey: ['profiles', 'search', term], queryFn: () => searchProfiles(term) });

export function useUpdateProfile() {
  const { userId, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProfileInput) => updateProfile(userId!, input),
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// ---------- フォロー ----------

export const useFollowingIds = () => {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => fetchFollowingIds(userId!),
    enabled: Boolean(userId),
  });
};

export const useFollowing = (userId: string | null | undefined) =>
  useQuery({
    queryKey: ['followList', 'following', userId],
    queryFn: () => fetchFollowing(userId!),
    enabled: Boolean(userId),
  });

export const useFollowers = (userId: string | null | undefined) =>
  useQuery({
    queryKey: ['followList', 'followers', userId],
    queryFn: () => fetchFollowers(userId!),
    enabled: Boolean(userId),
  });

export function useIsFollowing(targetUserId: string | null | undefined): boolean {
  const { data } = useFollowingIds();
  return Boolean(targetUserId && data?.includes(targetUserId));
}

export function useSetFollow() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetUserId, follow }: { targetUserId: string; follow: boolean }) =>
      setFollow(userId!, targetUserId, follow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followList'] });
      queryClient.invalidateQueries({ queryKey: ['profileStats'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'timeline'] });
    },
  });
}

// ---------- いいね ----------

export const useMyLikes = () => {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['likes', userId],
    queryFn: fetchMyLikedReviewIds,
    enabled: Boolean(userId),
  });
};

export function useSetLike() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, liked }: { reviewId: string; liked: boolean }) =>
      setLike(userId!, reviewId, liked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// ---------- コメント ----------

export const useComments = (reviewId: string, enabled = true) =>
  useQuery({
    queryKey: ['comments', reviewId],
    queryFn: () => fetchComments(reviewId),
    enabled: enabled && Boolean(reviewId),
  });

export function useAddComment() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, body }: { reviewId: string; body: string }) =>
      addComment(userId!, reviewId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; reviewId: string }) => deleteComment(commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}


// ---------- 展覧会の登録・編集 ----------

export function useCreateExhibition() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExhibitionInput) => createExhibition(userId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exhibitions'] }),
  });
}

export function useUpdateExhibition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExhibitionInput }) => updateExhibition(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exhibitions'] }),
  });
}

// ---------- 通報 ----------

export function useSubmitReport() {
  const { userId } = useAuth();
  return useMutation({
    mutationFn: ({
      targetType,
      targetId,
      reason,
      detail,
    }: {
      targetType: ReportTarget;
      targetId: string;
      reason: ReportReason;
      detail: string;
    }) => submitReport(userId!, targetType, targetId, reason, detail),
  });
}
