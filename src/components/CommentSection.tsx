import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useAddComment, useComments, useDeleteComment } from '../hooks/queries';

export default function CommentSection({ reviewId }: { reviewId: string }) {
  const { session, userId } = useAuth();
  const comments = useComments(reviewId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    await addComment.mutateAsync({ reviewId, body: text });
    setBody('');
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {comments.isLoading ? (
        <p className="text-xs text-gray-500">読み込み中...</p>
      ) : (
        <ul className="space-y-3">
          {(comments.data ?? []).map((comment) => (
            <li key={comment.id} className="flex gap-2">
              <Avatar author={comment.author} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  {comment.author ? (
                    <Link
                      to={`/u/${comment.author.handle}`}
                      className="text-sm font-medium text-navy hover:underline"
                    >
                      {comment.author.displayName || comment.author.handle}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">退会したユーザー</span>
                  )}
                  <span className="text-xs text-gray-400">{comment.createdAt.slice(0, 10)}</span>
                  {userId === comment.userId && (
                    <button
                      type="button"
                      onClick={() => deleteComment.mutate({ commentId: comment.id, reviewId })}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      削除
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {session ? (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            placeholder="コメントを書く..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button
            type="submit"
            disabled={!body.trim() || addComment.isPending}
            className="rounded-md bg-gold px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
          >
            送信
          </button>
        </form>
      ) : (
        <p className="mt-3 text-xs text-gray-500">
          <Link to="/login" className="text-navy-accent underline">
            ログイン
          </Link>
          するとコメントできます。
        </p>
      )}
    </div>
  );
}
