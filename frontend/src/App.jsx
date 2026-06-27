import React, { useState, useEffect, useRef } from 'react';
import QuoraModal from './components/QuoraModal';
import PostList from './components/PostList';
import {
  PlusCircle, Database, CheckCircle2, HelpCircle,
  AlertTriangle, ChevronDown, UserPlus, Search, X, Tag
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const TOPICS = ['All', 'WebDev', 'DevOps', 'Design', 'AI/ML', 'Security', 'Mobile', 'General'];
const TOPIC_COLORS = {
  WebDev:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  DevOps:   'bg-green-500/15 text-green-400 border-green-500/30',
  Design:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'AI/ML':  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Security: 'bg-red-500/15 text-red-400 border-red-500/30',
  Mobile:   'bg-pink-500/15 text-pink-400 border-pink-500/30',
  General:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function App() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notification, setNotification] = useState(null);

  // Filter / search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState('All');

  // Profile switcher dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // New profile creation
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: '', user_tech_stack: '', user_image: '' });
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    fetchUsers().then(() => fetchPosts());
  }, []);

  // Re-fetch posts when currentUser changes (so has_upvoted is updated)
  useEffect(() => {
    if (currentUser) fetchPosts();
  }, [currentUser?.id]);

  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const userId = currentUser?.id || '';
      const url = userId
        ? `${API_BASE_URL}/posts?user_id=${userId}`
        : `${API_BASE_URL}/posts`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load posts (Status: ${response.status})`);
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
      setApiError('Could not connect to backend. Make sure the Node server is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        if (data.length > 0 && !currentUser) setCurrentUser(data[0]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSubmitPost = async (postData) => {
    const isEditing = !!postData.id;
    const url = isEditing ? `${API_BASE_URL}/posts/${postData.id}` : `${API_BASE_URL}/posts`;
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: postData.user_id,
        post_content: postData.post_content,
        topic: postData.topic || 'General',
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to submit post');

    if (isEditing) {
      setPosts(prev => prev.map(p => p.id === postData.id ? result.post : p));
      triggerNotification('Post updated successfully!');
    } else {
      setPosts(prev => [result.post, ...prev]);
      triggerNotification('Post published successfully!');
    }
  };

  const handleDeletePost = async (postId) => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to delete post');
    setPosts(prev => prev.filter(p => p.id !== postId));
    triggerNotification('Post deleted.', 'info');
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newProfile.name.trim() || !newProfile.user_tech_stack.trim()) return;
    setIsCreatingProfile(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create profile');
      setUsers(prev => [...prev, result.user]);
      setCurrentUser(result.user);
      setNewProfile({ name: '', user_tech_stack: '', user_image: '' });
      setShowCreateProfile(false);
      triggerNotification(`Profile "${result.user.name}" created!`);
    } catch (err) {
      triggerNotification(err.message, 'error');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const switchUser = (user) => {
    setCurrentUser(user);
    setShowProfileMenu(false);
  };

  // Client-side filtering
  const filteredPosts = posts.filter(post => {
    const matchesTopic = activeTopic === 'All' || post.topic === activeTopic;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      post.post_content.toLowerCase().includes(q) ||
      post.user_name.toLowerCase().includes(q) ||
      (post.topic || '').toLowerCase().includes(q);
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/90 backdrop-blur-md">
        <div className="w-full px-4 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-quora-orange text-white rounded-xl font-black text-lg shadow-lg shadow-quora-orange/20 select-none">
              Q
            </div>
            <div>
              <span className="font-bold text-slate-100 text-base">QuoraTech</span>
              <span className="text-slate-500 text-xs ml-2 hidden sm:inline-block">Developer Feed</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">

            {/* Profile Switcher */}
            {currentUser && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(v => !v)}
                  className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-all"
                >
                  <img src={currentUser.user_image} alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-quora-orange/40" />
                  <span className="text-xs font-semibold text-slate-300 hidden sm:inline-block max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50 z-50 overflow-hidden animate-modal-in">
                    <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold border-b border-slate-800">
                      Switch Profile
                    </p>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => switchUser(u)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-800 transition-colors ${currentUser.id === u.id ? 'bg-quora-orange/10' : ''}`}
                        >
                          <img src={u.user_image} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${currentUser.id === u.id ? 'text-quora-orange' : 'text-slate-200'}`}>{u.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{u.user_tech_stack}</p>
                          </div>
                          {currentUser.id === u.id && <div className="w-1.5 h-1.5 rounded-full bg-quora-orange ml-auto flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add Post */}
            <button
              onClick={() => { setEditingPost(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 rounded-xl bg-quora-orange px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-quora-orange-hover shadow-lg shadow-quora-orange/15 hover:shadow-quora-orange/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ask Question</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Toast Notification ─────────────────────────────── */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-modal-in max-w-sm rounded-xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md">
          {notification.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            : notification.type === 'error'
              ? <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              : <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
          }
          <p className="text-sm font-semibold text-slate-200">{notification.message}</p>
        </div>
      )}

      {/* ── Main Layout ────────────────────────────────────── */}
      <main className="flex-1 w-full px-4 lg:px-8 py-8">

        {/* Connection error banner */}
        {apiError && (
          <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5 sm:mt-0" />
              <div>
                <h4 className="font-semibold text-slate-200">Backend Unavailable</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{apiError}</p>
              </div>
            </div>
            <button onClick={fetchPosts} className="shrink-0 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start max-w-7xl mx-auto">

          {/* ── Feed Column ────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search questions, users, topics..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-quora-orange transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Topic filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => setActiveTopic(topic)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    activeTopic === topic
                      ? 'bg-quora-orange text-white border-quora-orange'
                      : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Feed header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {activeTopic === 'All' ? 'Latest Questions' : activeTopic}
                <span className="bg-slate-900 border border-slate-800 text-[11px] px-2 py-0.5 rounded-full font-medium text-slate-400">
                  {filteredPosts.length}
                </span>
              </h2>
              <button onClick={fetchPosts} className="text-xs text-slate-500 hover:text-quora-orange transition-colors">
                Refresh
              </button>
            </div>

            <PostList
              posts={filteredPosts}
              isLoading={isLoading}
              onEdit={(post) => { setEditingPost(post); setIsModalOpen(true); }}
              onDelete={handleDeletePost}
              onCreateClick={() => { setEditingPost(null); setIsModalOpen(true); }}
              currentUser={currentUser}
              users={users}
            />
          </div>

          {/* ── Sidebar ─────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24">

            {/* Database Schema Widget */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-quora-orange" />
                Database Schema
              </h3>
              {[
                { table: 'users', key: 'PRIMARY KEY: id', cols: 'id, name, user_image, user_tech_stack, created_at' },
                { table: 'posts', key: 'FOREIGN KEY: user_id', cols: 'id, user_id, post_content, topic, created_at, updated_at' },
                { table: 'upvotes', key: 'UNIQUE (post_id, user_id)', cols: 'id, post_id, user_id, created_at' },
                { table: 'comments', key: 'FOREIGN KEYS', cols: 'id, post_id, user_id, comment_content, created_at' },
              ].map(({ table, key, cols }) => (
                <div key={table} className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-quora-orange font-bold">{table}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{key}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">{cols}</p>
                </div>
              ))}
            </div>

            {/* Topic Legend */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4 text-quora-orange" />
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TOPIC_COLORS).map(([topic, cls]) => (
                  <span key={topic} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Create Profile Widget */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-quora-orange" />
                  New Profile
                </h3>
                <button
                  onClick={() => setShowCreateProfile(v => !v)}
                  className="text-xs text-slate-500 hover:text-quora-orange transition-colors"
                >
                  {showCreateProfile ? 'Cancel' : 'Add'}
                </button>
              </div>

              {showCreateProfile && (
                <form onSubmit={handleCreateProfile} className="space-y-2.5 animate-modal-in">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newProfile.name}
                    onChange={e => setNewProfile(p => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-quora-orange transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack / Role *"
                    value={newProfile.user_tech_stack}
                    onChange={e => setNewProfile(p => ({ ...p, user_tech_stack: e.target.value }))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-quora-orange transition-colors"
                  />
                  <input
                    type="url"
                    placeholder="Avatar URL (optional)"
                    value={newProfile.user_image}
                    onChange={e => setNewProfile(p => ({ ...p, user_image: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-quora-orange transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingProfile}
                    className="w-full rounded-lg bg-quora-orange py-2 text-xs font-semibold text-white hover:bg-quora-orange-hover disabled:opacity-50 transition-colors"
                  >
                    {isCreatingProfile ? 'Creating...' : 'Create Profile'}
                  </button>
                </form>
              )}

              {!showCreateProfile && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Add a new developer profile to post, comment and upvote from a different identity.
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-300">💡 Tips</h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Use the profile dropdown in the header to switch users.</li>
                <li>Use <code className="bg-slate-900 px-1 py-0.5 rounded text-quora-orange">**bold**</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-quora-orange">*italic*</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-quora-orange">`code`</code> formatting.</li>
                <li>Pick a topic when posting for better discoverability.</li>
                <li>Click 👍 to upvote, 💬 to open comments.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal ───────────────────────────────────────────── */}
      <QuoraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitPost}
        onDelete={handleDeletePost}
        post={editingPost}
        users={users}
        currentUser={currentUser}
      />
    </div>
  );
}
