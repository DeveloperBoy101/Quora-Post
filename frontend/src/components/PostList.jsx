import React from 'react';
import PostCard from './PostCard';
import { MessageSquarePlus } from 'lucide-react';

export default function PostList({ posts, isLoading, onEdit, onDelete, onCreateClick, currentUser, users = [] }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-5 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-3 bg-slate-800 rounded w-1/6" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
        <div className="bg-slate-900 p-4 rounded-full border border-slate-850 mb-4 text-slate-500">
          <MessageSquarePlus className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300">No posts yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Be the first to share your thoughts, ask a question, or talk about your tech stack!
        </p>
        <button
          onClick={onCreateClick}
          className="mt-5 rounded-lg bg-quora-orange px-4 py-2 text-xs font-semibold text-white hover:bg-quora-orange-hover shadow-md shadow-quora-orange/10 transition-colors"
        >
          Add Your First Post
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onEdit={onEdit}
          onDelete={onDelete}
          currentUser={currentUser}
          users={users}
        />
      ))}
    </div>
  );
}
