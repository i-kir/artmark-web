import React, { createContext, useContext, useState, useEffect } from 'react';
import { Review } from '@/types';
import { mockReviews } from '@/data/reviews';

interface ReviewContextType {
  reviews: Review[];
  addReview: (review: Review) => void;
  getReviewsForTarget: (targetType: 'museum' | 'exhibition', targetId: string) => Review[];
  getAverageRating: (targetType: 'museum' | 'exhibition', targetId: string) => number;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

const STORAGE_KEY = '@artmark_reviews';

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const loadReviews = () => {
      try {
        const storedReviews = localStorage.getItem(STORAGE_KEY);
        if (storedReviews) {
          setReviews(JSON.parse(storedReviews));
        } else {
          setReviews(mockReviews);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mockReviews));
        }
      } catch (error) {
        console.error('Failed to load reviews from localStorage', error);
        setReviews(mockReviews);
      }
    };
    
    loadReviews();
  }, []);

  const addReview = (review: Review) => {
    const newReviews = [review, ...reviews];
    setReviews(newReviews);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReviews));
    } catch (error) {
      console.error('Failed to save reviews to localStorage', error);
    }
  };

  const getReviewsForTarget = (targetType: 'museum' | 'exhibition', targetId: string) => {
    return reviews.filter(
      (r) => r.targetType === targetType && r.targetId === targetId
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getAverageRating = (targetType: 'museum' | 'exhibition', targetId: string) => {
    const targetReviews = getReviewsForTarget(targetType, targetId);
    if (targetReviews.length === 0) return 0;
    
    const sum = targetReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / targetReviews.length) * 10) / 10;
  };

  return (
    <ReviewContext.Provider value={{ reviews, addReview, getReviewsForTarget, getAverageRating }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};

// Export an alias
export const useReviews = useReview;
