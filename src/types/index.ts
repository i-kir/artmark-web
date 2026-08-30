export interface Museum {
  id: string;
  name: string;
  nameKana: string;
  address: string;
  area: string;
  imageUrl: string;
  description: string;
  openingHours: string;
  closedDays: string;
  website: string;
  averageRating: number;
  reviewCount: number;
}

export interface Exhibition {
  id: string;
  museumId: string;
  title: string;
  imageUrl: string;
  description: string;
  startDate: string;
  endDate: string;
  price: string;
  genre: string[];
  averageRating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  targetType: 'museum' | 'exhibition';
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  visitDate: string;
  createdAt: string;
}

export interface User {
  id: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
}

export type ClipStatus = 'none' | 'want' | 'visited';
