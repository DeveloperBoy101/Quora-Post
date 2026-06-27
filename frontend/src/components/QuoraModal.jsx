import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, Edit2, Trash2, ShieldAlert, Bold, Italic, Code } from 'lucide-react';

const TOPICS = ['General', 'WebDev', 'DevOps', 'Design', 'AI/ML', 'Security', 'Mobile'];

/** Same inline parser as PostCard for live preview */
function parseInline(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2] !== undefined) parts.push(<strong key={key++} className="font-bold text-slate-100">{match[2]}</strong>);
    else if (match[3] !== undefined) parts.push(<em key={key++} className="italic text-slate-300">{match[3]}</em>);
    else if (match[4] !== undefined) parts.push(<code key={key++} className="bg-slate-950 border border-slate-700 text-quora-orange text-[13px] font-mono px-1.5 py-0.5 rounded">{match[4]}</code>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function formatPreviewContent(text) {
  if (!text) return <span className="text-slate-500 italic">Start typing to see preview…</span>;
  return text.split('\n').map((line, idx) => {
    if (line.startsWith('```')) {
      return (
        <pre key={idx} className="my-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-quora-orange font-mono overflow-x-auto">
          {line.replace(/```/g, '').trim() || ' '}
        </pre>
      );
    }
    const tokens = parseInline(line);
    return (
      <p key={idx} className="min-h-[1.5rem] text-slate-300 leading-relaxed text-[15px]">
        {tokens.length > 0 ? tokens : '\u00A0'}
      </p>
    );
  });
}

export default function QuoraModal({
  isOpen, onClose, onSubmit, onDelete,
  post = null, users = [], currentUser = null
}) {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('General');
  const [activeTab, setActiveTab] = useState('write');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (post) {
        setContent(post.post_content || '');
        setTopic(post.topic || 'General');
        setSelectedUserId(post.user_id ? String(post.user_id) : '');
      } else {
        setContent('');
        setTopic('General');
        setSelectedUserId(currentUser ? String(currentUser.id) : users[0]?.id ? String(users[0].id) : '');
      }
      setActiveTab('write');
      setError('');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, post, users, currentUser]);

  if (!isOpen) return null;

  const activeUser = users.find(u => String(u.id) === selectedUserId) || currentUser || users[0];

  /** Insert markdown syntax at cursor */
  const insertFormat = (before, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    // Restore cursor
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setError('Post content cannot be empty.'); return; }
    if (content.length > 5000) { setError('Post cannot exceed 5000 characters.'); return; }
    if (!selectedUserId) { setError('Please select a user profile.'); return; }

    setIsSubmitting(true);
    try {
      await onSubmit({ id: post?.id, user_id: parseInt(selectedUserId), post_content: content, topic });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    setIsSubmitting(true);
    try {
      await onDelete(post.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete post');
      setShowDeleteConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-backdrop-in"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl lg:max-w-3xl overflow-hidden rounded-2xl border border-quora-navy-border bg-quora-navy-light shadow-2xl animate-modal-in flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-quora-navy-border px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-quora-orange animate-pulse" />
            <h2 className="text-xl font-bold text-slate-100">
              {post ? 'Edit Post' : 'Ask a Question'}
            </h2>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info + profile switcher */}
        <div className="px-6 py-4 bg-slate-900/30 border-b border-quora-navy-border/50 flex flex-wrap items-center justify-between gap-4">
          {activeUser && (
            <div className="flex items-center gap-3">
              <img src={activeUser.user_image} alt={activeUser.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-quora-orange/40" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-200 text-sm">{activeUser.name}</h3>
                  <span className="rounded-full bg-quora-orange/10 px-2 py-0.5 text-[11px] font-medium text-quora-orange border border-quora-orange/20">
                    {activeUser.user_tech_stack}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Posting as {activeUser.name}</p>
              </div>
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Topic selector */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-400">Topic:</label>
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="bg-slate-800 border border-quora-navy-border rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-quora-orange transition-colors cursor-pointer"
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Profile switcher (create mode only) */}
            {!post && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-400">Profile:</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="bg-slate-800 border border-quora-navy-border rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-quora-orange transition-colors cursor-pointer"
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex border-b border-quora-navy-border/30 bg-slate-900/10 gap-1">
          {[{ id: 'write', icon: Edit2, label: 'Write' }, { id: 'preview', icon: Eye, label: 'Preview' }].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all rounded-t-lg ${
                activeTab === id
                  ? 'border-quora-orange text-quora-orange bg-quora-orange/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'write' ? (
            <div className="space-y-2 flex flex-col h-full">
              {/* Formatting toolbar */}
              <div className="flex items-center gap-1 p-1 bg-slate-900/50 border border-quora-navy-border rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => insertFormat('**', '**')}
                  title="Bold (**text**)"
                  className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat('*', '*')}
                  title="Italic (*text*)"
                  className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat('`', '`')}
                  title="Inline code (`code`)"
                  className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                >
                  <Code className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-700 mx-1" />
                <span className="text-[10px] text-slate-500 px-1">Formatting</span>
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => { setContent(e.target.value); if (error) setError(''); }}
                placeholder="What is your question or share something useful? Use **bold**, *italic*, `code`…"
                className="w-full flex-1 min-h-[200px] bg-slate-900/50 border border-quora-navy-border rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-quora-orange focus:ring-1 focus:ring-quora-orange transition-all resize-none text-[15px] leading-relaxed"
                maxLength={5000}
              />
              <div className="flex justify-between text-xs text-slate-500 px-1">
                <span>Supports <code className="text-quora-orange">**bold**</code>, <code className="text-quora-orange">*italic*</code>, <code className="text-quora-orange">`code`</code></span>
                <span className={content.length >= 4500 ? 'text-quora-orange font-semibold' : ''}>
                  {content.length}/5000
                </span>
              </div>
            </div>
          ) : (
            <div className="border border-quora-navy-border rounded-xl p-5 bg-slate-900/40 space-y-4">
              <div className="flex items-center gap-3">
                <img src={activeUser?.user_image} alt={activeUser?.name}
                  className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">{activeUser?.name}</span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-quora-orange font-medium text-xs">{activeUser?.user_tech_stack}</span>
                    {topic && topic !== 'General' && (
                      <span className="text-[10px] bg-quora-orange/10 text-quora-orange border border-quora-orange/20 px-1.5 py-0.5 rounded-full font-semibold">{topic}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Live Preview · Public</p>
                </div>
              </div>
              <div className="space-y-2 border-l-2 border-quora-orange/20 pl-3.5 py-1">
                {formatPreviewContent(content)}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-quora-navy-border/30">
                <span>0 Upvotes</span><span>·</span><span>0 Comments</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-quora-navy-border px-6 py-4 bg-slate-900/60 flex items-center justify-between gap-4">
          <div>
            {post && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-red-400">Delete this post?</span>
                <button type="button" onClick={handleDeletePost} disabled={isSubmitting}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors">
                  Yes, Delete
                </button>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={isSubmitting}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button" onClick={onClose} disabled={isSubmitting}
              className="rounded-lg bg-slate-800 border border-quora-navy-border px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button" onClick={handleFormSubmit}
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 rounded-lg bg-quora-orange px-6 py-2 text-sm font-semibold text-white hover:bg-quora-orange-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-quora-orange/10 hover:shadow-quora-orange/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving…
                </>
              ) : (post ? 'Save Changes' : 'Publish Post')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
