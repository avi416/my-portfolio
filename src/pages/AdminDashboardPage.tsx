import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import {
  HomeIcon, FolderIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon,
  PlusIcon, TrashIcon, ArrowTopRightOnSquareIcon, ArrowRightOnRectangleIcon,
  CheckCircleIcon, ExclamationCircleIcon, PhotoIcon, LockClosedIcon,
  ChartBarIcon, EyeIcon, StarIcon, CodeBracketIcon
} from '@heroicons/react/24/outline';
import type { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { db, loginWithGoogle, logout, onAuthChange, checkIsAdmin } from '../services/firebase';

// Helper function to resize and compress image to base64
const resizeImageToBase64 = (file: File, maxWidth: number = 400, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  githubLink: string;
  liveLink: string;
}

const AdminDashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', tags: '', githubLink: '', liveLink: '' });
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      if (currentUser && checkIsAdmin(currentUser.email)) {
        setUser(currentUser);
        fetchProjects();
        fetchProfileImage();
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchProfileImage = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'profile'));
      if (docSnap.exists() && docSnap.data().profileImageBase64) {
        setProfileImagePreview(docSnap.data().profileImageBase64);
      }
    } catch (error) { console.error('Error fetching profile image:', error); }
  };

  const fetchProjects = async () => {
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    } catch (error) { console.error('Error fetching projects:', error); }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await resizeImageToBase64(file, 400, 0.8);
        setProfileImageBase64(base64);
        setProfileImagePreview(base64);
      } catch (error) { setError('Failed to process image'); }
    }
  };

  const handleSaveProfileImage = async () => {
    if (!profileImageBase64) return;
    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'settings', 'profile'), { profileImageBase64, updatedAt: serverTimestamp() }, { merge: true });
      setProfileSuccess('Profile image saved!');
      setProfileImageBase64('');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error) { setError('Failed to save: ' + (error as Error).message); }
    setSavingProfile(false);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await resizeImageToBase64(file, 800, 0.8);
        setImageBase64(base64);
        setImagePreview(base64);
      } catch (error) { setError('Failed to process image'); }
    }
  };

  const resetForm = () => {
    setProjectForm({ title: '', description: '', tags: '', githubLink: '', liveLink: '' });
    setImageBase64('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.description) return;
    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'projects'), {
        ...projectForm,
        tags: projectForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        imageUrl: imageBase64,
        createdAt: serverTimestamp(),
      });
      setSuccessMessage('Project created!');
      resetForm();
      setShowForm(false);
      fetchProjects();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) { setError((err as Error).message); }
    setSubmitting(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjects(projects.filter(p => p.id !== id));
      setSuccessMessage('Project deleted!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) { setError((err as Error).message); }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    const result = await loginWithGoogle();
    if (result.error) setError(result.error.message);
    setIsLoggingIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <LockClosedIcon className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white text-center mb-2">Admin Portal</h1>
            <p className="text-gray-400 text-center mb-8">Sign in to manage your portfolio</p>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-300">
                <ExclamationCircleIcon className="w-5 h-5" />
                {error}
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full py-4 px-6 bg-white text-gray-900 font-semibold rounded-2xl hover:bg-gray-100 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { name: 'Overview', icon: HomeIcon },
    { name: 'Projects', icon: FolderIcon },
    { name: 'Messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Settings', icon: Cog6ToothIcon },
  ];

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderIcon, color: 'purple' },
    { label: 'Total Views', value: '1.2K', icon: EyeIcon, color: 'blue' },
    { label: 'Messages', value: '8', icon: ChatBubbleLeftRightIcon, color: 'green' },
    { label: 'GitHub Stars', value: '156', icon: StarIcon, color: 'yellow' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <ChartBarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {user.email}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => logout()}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-xl flex items-center gap-2 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-6 h-6" />
              {successMessage}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
              <ExclamationCircleIcon className="w-6 h-6" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tab.Group>
          <Tab.List className="flex gap-2 p-1.5 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm mb-8">
            {tabs.map((tab) => (
              <Tab key={tab.name} className={({ selected }) => `flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all outline-none ${selected ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.name}</span>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Overview Panel */}
            <Tab.Panel>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'purple' ? 'bg-purple-500/10' : stat.color === 'blue' ? 'bg-blue-500/10' : stat.color === 'green' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color === 'purple' ? 'text-purple-500' : stat.color === 'blue' ? 'text-blue-500' : stat.color === 'green' ? 'text-green-500' : 'text-yellow-500'}`} />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
                {projects.length > 0 && (
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Projects</h3>
                    <div className="space-y-3">
                      {projects.slice(0, 3).map((p) => (
                        <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold">{p.title[0]}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{p.title}</p>
                            <p className="text-xs text-gray-500 truncate">{p.tags?.join(', ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </Tab.Panel>

            {/* Projects Panel */}
            <Tab.Panel>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Projects ({projects.length})</h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(!showForm)}
                    className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${showForm ? 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'}`}
                  >
                    <PlusIcon className="w-5 h-5" />
                    {showForm ? 'Cancel' : 'Add Project'}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <form onSubmit={handleSubmitProject} className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                            <input type="text" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                            <input type="text" value={projectForm.tags} onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })} placeholder="React, TypeScript" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                          <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none" required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GitHub URL</label>
                            <input type="url" value={projectForm.githubLink} onChange={(e) => setProjectForm({ ...projectForm, githubLink: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live URL</label>
                            <input type="url" value={projectForm.liveLink} onChange={(e) => setProjectForm({ ...projectForm, liveLink: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image</label>
                          <div className="flex items-center gap-4">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl flex items-center gap-2 transition-all">
                              <PhotoIcon className="w-5 h-5" />
                              Choose
                            </button>
                            {imagePreview && <img src={imagePreview} alt="" className="h-16 w-24 object-cover rounded-xl" />}
                          </div>
                        </div>
                        <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                          {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                          {submitting ? 'Creating...' : 'Create Project'}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {projects.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-neutral-800 rounded-2xl">
                    <FolderIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {projects.map((p, i) => (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-2xl font-bold">{p.title[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{p.description}</p>
                          <div className="flex gap-2 mt-2">
                            {p.tags?.slice(0, 3).map((t, i) => <span key={i} className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-500 rounded-md">{t}</span>)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {p.liveLink && <a href={p.liveLink} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-all"><ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-500" /></a>}
                          {p.githubLink && <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-all"><CodeBracketIcon className="w-5 h-5 text-gray-500" /></a>}
                          <button onClick={() => handleDeleteProject(p.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><TrashIcon className="w-5 h-5 text-red-500" /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </Tab.Panel>

            {/* Messages Panel */}
            <Tab.Panel>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white dark:bg-neutral-800 rounded-2xl">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">Messages Coming Soon</p>
                <p className="text-gray-500 dark:text-gray-400">View contact form submissions here</p>
              </motion.div>
            </Tab.Panel>

            {/* Settings Panel */}
            <Tab.Panel>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <PhotoIcon className="w-6 h-6" />
                    Profile Image
                  </h3>
                  {profileSuccess && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      {profileSuccess}
                    </motion.div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-700 border-2 border-dashed border-gray-300 dark:border-neutral-600 flex items-center justify-center">
                      {profileImagePreview ? <img src={profileImagePreview} alt="" className="w-full h-full object-cover" /> : <PhotoIcon className="w-12 h-12 text-gray-400" />}
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Upload a profile image for your homepage. Max 400x400 pixels.</p>
                      <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                      <div className="flex gap-3">
                        <button type="button" onClick={() => profileInputRef.current?.click()} className="px-4 py-2.5 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl flex items-center gap-2 transition-all">
                          <PhotoIcon className="w-5 h-5" />
                          Choose Image
                        </button>
                        {profileImageBase64 && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveProfileImage}
                            disabled={savingProfile}
                            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50"
                          >
                            {savingProfile ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                            Save
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
