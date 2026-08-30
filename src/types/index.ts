export type TargetType = 'museum' | 'exhibition';

/** クリップの状態。'none' は「クリップしていない」を表す UI 上の値で、DB には保存されない */
export type ClipStatus = 'none' | 'want' | 'visited';

export interface Profile {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
}

export interface Rating {
  averageRating: number;
  reviewCount: number;
}

export interface Museum {
  id: string;
  name: string;
  nameKana: string;
  address: string;
  prefecture: string;
  area: string;
  imageUrl: string | null;
  description: string;
  openingHours: string;
  closedDays: string;
  website: string | null;
}

export interface Exhibition {
  id: string;
  museumId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  price: string;
  imageUrl: string | null;
  officialUrl: string | null;
  genre: string[];
}

export interface Review {
  id: string;
  userId: string;
  targetType: TargetType;
  targetId: string;
  /** 未評価（記録のみ）の場合は null */
  rating: number | null;
  comment: string;
  visitDate: string | null;
  hasSpoiler: boolean;
  createdAt: string;
  author: Pick<Profile, 'handle' | 'displayName' | 'avatarUrl'> | null;
}

export interface Clip {
  targetType: TargetType;
  targetId: string;
  status: Exclude<ClipStatus, 'none'>;
  createdAt: string;
}
