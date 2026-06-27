import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Calendar, MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import CommentsModal from './CommentsModal.jsx';

const TOPIC_COLORS = {
  WebDev:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  DevOps:   'bg-green-500/15 text-green-400 border-green-500/30',
  Design:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'AI/ML':  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Security: 'bg-red-500/15 text-red-400 border-red-500/30',
  Mobile:   'bg-pink-500/15 text-pink-400 border-pink-500/30',
  General:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

/** Enhanced markdown: **bold**, *italic*, `code`, ```block``` */
function formatContent(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Code block (triple backtick single line fallback)
    if (line.startsWith('```')) {
      return (
        <pre key={idx} className="my-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-quora-orange font-mono overflow-x-auto">
          {line.replace(/```/g, '').trim() || ' '}
        </pre>
      );
    }

    // Inline parsing: bold, italic, inline code
    const tokens = parseInline(line);
    return (
      <p key={idx} className="min-h-[1.25rem] text-slate-300 text-[15px] leading-relaxed mb-1.5 last:mb-0">
        {tokens.length > 0 ? tokens : '\u00A0'}
      </p>
    );
  });
}

function parseInline(text) {
  const parts = [];
  // Combined regex: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2] !== undefined) {
      parts.push(<strong key={key++} className="font-bold text-slate-100">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={key++} className="italic text-slate-300">{match[3]}</em>);
    } else if (match[4] !== undefined) {
      parts.push(<code key={key++} className="bg-slate-950 border border-slate-700 text-quora-orange text-[13px] font-mono px-1.5 py-0.5 rounded">{match[4]}</code>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function PostCard({ post, onEdit, onDelete, currentUser, users = [] }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Read stats from post object (provided by optimized backend JOIN)
  const [upvoteCount, setUpvoteCount] = useState(Number(post.upvote_count) || 0);
  const [commentCount, setCommentCount] = useState(Number(post.comment_count) || 0);
  const [hasUpvoted, setHasUpvoted] = useState(Boolean(post.has_upvoted));
  const [isLoadingUpvote, setIsLoadingUpvote] = useState(false);

  // Sync when post prop changes (e.g. user switch)
  useEffect(() => {
    setUpvoteCount(Number(post.upvote_count) || 0);
    setCommentCount(Number(post.comment_count) || 0);
    setHasUpvoted(Boolean(post.has_upvoted));
  }, [post.upvote_count, post.comment_count, post.has_upvoted, post.id]);

  const handleUpvote = async () => {
    if (!currentUser) return;
    setIsLoadingUpvote(true);
    try {
      const endpoint = hasUpvoted
        ? `http://localhost:5000/api/posts/${post.id}/upvotes/${currentUser.id}`
        : `http://localhost:5000/api/posts/${post.id}/upvotes`;
      const method = hasUpvoted ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ user_id: currentUser.id }) : undefined
      });

      if (!response.ok) throw new Error('Failed to update upvote');
      const data = await response.json();
      setUpvoteCount(data.upvotes);
      setHasUpvoted(!hasUpvoted);
    } catch (error) {
      console.error('Error updating upvote:', error);
    } finally {
      setIsLoadingUpvote(false);
    }
  };

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Just now';
    }
  };

  const topicClass = TOPIC_COLORS[post.topic] || TOPIC_COLORS.General;

  return (
    <>
      <article className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 lg:p-6 shadow-sm hover:border-slate-700/60 hover:bg-slate-900/60 transition-all duration-300">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={post.user_image} alt={post.user_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800 group-hover:ring-quora-orange/20 transition-all flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-slate-200 hover:text-quora-orange cursor-pointer transition-colors text-sm truncate">
                  {post.user_name}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400 border border-slate-700/50 flex-shrink-0">
                  {post.user_tech_stack}
                </span>
                {post.topic && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border flex-shrink-0 ${topicClass}`}>
                    {post.topic}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{formatTime(post.updated_at || post.created_at)}</span>
                {post.updated_at && post.updated_at !== post.created_at && (
                  <span className="text-[10px] bg-slate-800 px-1 py-0.5 rounded text-slate-400">Edited</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onEdit(post)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-quora-orange transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {isDeleting ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => { try { await onDelete(post.id); } catch { setIsDeleting(false); } }}
                  className="bg-red-950 border border-red-500/30 text-red-400 px-2 py-0.5 text-xs rounded hover:bg-red-900 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="bg-slate-800 text-slate-300 px-1.5 py-0.5 text-xs rounded hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsDeleting(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 pl-2 border-l-2 border-slate-800 group-hover:border-quora-orange/30 transition-colors py-0.5">
          {formatContent(post.post_content)}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <button
              onClick={handleUpvote}
              disabled={isLoadingUpvote || !currentUser}
              className={`flex items-center gap-1.5 transition-all group/btn ${
                hasUpvoted ? 'text-quora-orange' : 'hover:text-quora-orange'
              } disabled:opacity-50`}
              title={currentUser ? (hasUpvoted ? 'Remove upvote' : 'Upvote') : 'Select a user to upvote'}
            >
              <ThumbsUp className={`w-4 h-4 group-hover/btn:scale-110 transition-transform ${hasUpvoted ? 'fill-current' : ''}`} />
              <span className="font-medium">{upvoteCount}</span>
            </button>

            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-1.5 hover:text-quora-orange transition-colors group/btn"
            >
              <MessageSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              <span className="font-medium">{commentCount}</span>
            </button>

            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex items-center gap-1.5 hover:text-quora-orange transition-colors group/btn"
              title="Copy link"
            >
              <Share2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
          <span className="text-[10px] text-slate-700 font-mono">#{post.id}</span>
        </div>
      </article>

      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        currentUser={currentUser}
        users={users}
        onCommentAdded={() => setCommentCount(c => c + 1)}
        onCommentDeleted={() => setCommentCount(c => Math.max(0, c - 1))}
      />
    </>
  );
}
