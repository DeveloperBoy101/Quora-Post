import React, { useState, useEffect } from 'react';
import { X, Send, Trash2, MessageSquare } from 'lucide-react';

export default function CommentsModal({
  isOpen, onClose, postId, currentUser, users = [],
  onCommentAdded, onCommentDeleted
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && postId) fetchComments();
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      setComments(await response.json());
    } catch (err) {
      setError('Failed to load comments');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) { setError('Comment cannot be empty'); return; }
    if (!currentUser) { setError('Please select a user profile'); return; }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, comment_content: newComment })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add comment');
      }

      const result = await response.json();
      setComments(prev => [result.comment, ...prev]);
      setNewComment('');
      setError('');
      onCommentAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/comments/${commentId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete comment');
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentDeleted?.();
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Just now'; }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl lg:max-w-3xl max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col animate-modal-in">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-quora-orange" />
            <h2 className="text-lg font-bold text-slate-100">
              Comments
              {comments.length > 0 && (
                <span className="ml-2 text-sm font-medium text-slate-400">({comments.length})</span>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isFetching ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="rounded-xl bg-slate-800/30 p-3 animate-pulse space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-700 rounded-full" />
                    <div className="h-3 bg-slate-700 rounded w-24" />
                  </div>
                  <div className="h-3 bg-slate-700 rounded w-full" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group rounded-xl bg-slate-800/30 border border-slate-800 p-3.5 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <img src={comment.user_image} alt={comment.user_name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-200 text-sm">{comment.user_name}</span>
                        <span className="text-xs text-slate-500">{formatTime(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1 leading-relaxed break-words">{comment.comment_content}</p>
                    </div>
                  </div>
                  {currentUser && currentUser.id === comment.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1 flex-shrink-0"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t border-slate-800 px-6 py-4 bg-slate-900/60">
          {error && (
            <div className="mb-3 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          {currentUser ? (
            <form onSubmit={handleAddComment} className="flex items-start gap-3">
              <img src={currentUser.user_image} alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <textarea
                  value={newComment}
                  onChange={e => { setNewComment(e.target.value); if (error) setError(''); }}
                  placeholder={`Reply as ${currentUser.name}…`}
                  maxLength={1000}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-quora-orange resize-none transition-colors"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{newComment.length}/1000</span>
                  <button
                    type="submit"
                    disabled={isLoading || !newComment.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-quora-orange hover:bg-quora-orange-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isLoading ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-500 text-center py-2">Select a user profile to leave a comment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
