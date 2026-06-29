import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Review } from '../types';

interface FoodReviewsProps {
  foodId: string;
  lang?: 'ko' | 'en';
}

export default function FoodReviews({ foodId, lang = 'ko' }: FoodReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('foodId', '==', foodId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedReviews.push({
          id: doc.id,
          foodId: data.foodId,
          userId: data.userId,
          userName: data.userName,
          rating: data.rating,
          comment: data.comment,
          createdAt: data.createdAt?.toMillis() || Date.now(),
        } as any);
      });
      setReviews(fetchedReviews);
    }, (error) => {
      console.error('Error fetching reviews:', error);
      setError(lang === 'ko' ? '리뷰를 불러오는 중 오류가 발생했습니다.' : 'An error occurred while fetching reviews.');
    });

    return () => unsubscribe();
  }, [foodId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert(lang === 'ko' ? '로그인 후 이용해 주세요.' : 'Please log in to use this feature.');
      return;
    }
    if (!newComment.trim()) {
      alert(lang === 'ko' ? '리뷰 내용을 입력해 주세요.' : 'Please enter your review.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'reviews'), {
        foodId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || (lang === 'ko' ? '익명 사용자' : 'Anonymous'),
        rating: newRating,
        comment: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
      setNewRating(5);
    } catch (error) {
      console.error('Error adding review:', error);
      setError(lang === 'ko' ? '리뷰 등록 중 오류가 발생했습니다. 권한이 없거나 네트워크 문제일 수 있습니다.' : 'An error occurred while submitting your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-100 mt-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-lg text-neutral-800">{lang === 'ko' ? '리뷰' : 'Reviews'} ({reviews.length})</h3>
        {reviews.length > 0 && (
          <div className="ml-auto flex items-center gap-1 text-orange-500 font-medium">
            <Star className="w-4 h-4 fill-current" />
            <span>{averageRating}</span>
          </div>
        )}
      </div>

      {auth.currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-neutral-700">{lang === 'ko' ? '별점:' : 'Rating:'}</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${star <= newRating ? 'fill-orange-400 text-orange-400' : 'text-neutral-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={lang === 'ko' ? "이 음식에 대한 후기를 남겨주세요." : "Leave a review for this food."}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none h-24 mb-3 text-sm text-neutral-800"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (lang === 'ko' ? '등록 중...' : 'Submitting...') : (lang === 'ko' ? '리뷰 등록' : 'Submit Review')}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2 text-right">{error}</p>}
        </form>
      ) : (
        <div className="mb-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
          <p className="text-sm text-neutral-600">{lang === 'ko' ? '리뷰를 작성하려면 로그인이 필요합니다.' : 'Please log in to leave a review.'}</p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-neutral-500 text-sm py-6">{lang === 'ko' ? '첫 번째 리뷰를 남겨보세요!' : 'Be the first to leave a review!'}</p>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm text-neutral-800">{review.userName}</span>
                  <div className="flex items-center gap-0.5 text-orange-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-neutral-300'}`} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-neutral-400">
                  {new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }).format(review.createdAt)}
                </span>
              </div>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap mt-2">{review.comment}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
