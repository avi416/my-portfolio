import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import {
  HomeIcon, FolderIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon,
  PlusIcon, TrashIcon, PhotoIcon, ArrowTopRightOnSquareIcon,
  CodeBracketIcon, CheckCircleIcon, ExclamationCircleIcon,
  ArrowRightOnRectangleIcon, LockClosedIcon, ChartBarIcon,
  EyeIcon, StarIcon, ClockIcon, SparklesIcon, BellIcon,
  UserCircleIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { db, loginWithGoogle, logout, useAuth } from '../services/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, serverTimestamp, query, orderBy, setDoc, getDoc } from 'firebase/firestore';

// Helper function
const resizeImageToBase64 = (file: File, maxWidth = 400, maxHeight = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface Project {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  imageUrl?: string;
  githubLink?: string;
  liveLink?: string;
  createdAt?: { seconds: number };
}

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt?: { seconds: number };
  read?: boolean;
}

const AdminDashboardPage = () => {
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', tags: '', githubLink: '', liveLink: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [profileImageBase64, setProfileImageBase64] = useState('');
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  const fetchProjects = async () => {
    const snap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
    setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
  };

  const fetchMessages = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc')));
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    } catch (err) {
      console.log('Messages collection may not exist yet');
    }
  };

  const fetchProfileImage = async () => {
    const docRef = await getDoc(doc(db, 'settings', 'profile'));
    if (docRef.exists()) setProfileImagePreview(docRef.data().imageUrl || '');
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchMessages();
      fetchProfileImage();
    }
  }, [user]);

  const resetForm = () => {
    setProjectForm({ title: '', description: '', tags: '', githubLink: '', liveLink: '' });
    setImagePreview('');
    setImageBase64('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImageToBase64(file, 600, 400);
    setImagePreview(base64);
    setImageBase64(base64);
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImageToBase64(file);
    setProfileImagePreview(base64);
    setProfileImageBase64(base64);
  };

  const handleSaveProfileImage = async () => {
    if (!profileImageBase64) return;
    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'settings', 'profile'), { imageUrl: profileImageBase64 });
      setProfileSuccess('Profile image saved!');
      setProfileImageBase64('');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
    setSavingProfile(false);
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
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
    } catch (err) {
      setError((err as Error).message);
    }
    setSubmitting(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjects(projects.filter(p => p.id !== id));
      setSuccessMessage('Project deleted!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      setMessages(messages.filter(m => m.id !== id));
      setSuccessMessage('Message deleted!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    const result = await loginWithGoogle();
    if (result.error) setError(result.error.message);
    setIsLoggingIn(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-500/30 rounded-full"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-blue-500/10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                  <LockClosedIcon className="w-12 h-12 text-white" />
                </div>
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl opacity-30 blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <h1 className="text-4xl font-bold text-white text-center mb-2">Welcome Back</h1>
              <p className="text-gray-400 text-center mb-8">Sign in to access your admin dashboard</p>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400"
                >
                  <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full py-4 px-6 bg-white text-gray-900 font-semibold rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
            </motion.button>

            <p className="text-center text-gray-500 text-sm mt-6">
              Secure authentication powered by Google
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { name: 'Overview', icon: HomeIcon },
    { name: 'Projects', icon: FolderIcon },
    { name: 'Messages', icon: ChatBubbleLeftRightIcon, badge: messages.length },
    { name: 'Settings', icon: Cog6ToothIcon },
  ];

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderIcon, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10' },
    { label: 'Messages', value: messages.length, icon: ChatBubbleLeftRightIcon, color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-500/10' },
    { label: 'Views', value: '2.4K', icon: EyeIcon, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10' },
    { label: 'Stars', value: '156', icon: StarIcon, color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-500/10' },
  ];

  const recentActivity = [
    { action: 'New message received', time: '2 hours ago', icon: ChatBubbleLeftRightIcon, color: 'text-cyan-500' },
    { action: 'Project updated', time: '5 hours ago', icon: FolderIcon, color: 'text-blue-500' },
    { action: 'Profile image changed', time: '1 day ago', icon: UserCircleIcon, color: 'text-teal-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-14 h-14 bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <ChartBarIcon className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl relative transition-colors"
            >
              <BellIcon className="w-5 h-5 text-gray-400" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white text-xs flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => logout()}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl flex items-center gap-2 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </motion.header>

        {/* Alerts */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400"
            >
              <CheckCircleIcon className="w-6 h-6" />
              {successMessage}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400"
            >
              <ExclamationCircleIcon className="w-6 h-6" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tab.Group>
          <Tab.List className="flex gap-2 p-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all outline-none whitespace-nowrap ${
                    selected
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.name}</span>
                {tab.badge ? (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{tab.badge}</span>
                ) : null}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Overview Panel */}
            <Tab.Panel>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ color: stat.color.includes('blue') ? '#3b82f6' : stat.color.includes('cyan') ? '#06b6d4' : stat.color.includes('green') ? '#22c55e' : '#eab308' }} />
                        </div>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Projects */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FolderIcon className="w-5 h-5 text-blue-500" />
                        Recent Projects
                      </h3>
                      <span className="text-sm text-gray-400">{projects.length} total</span>
                    </div>
                    {projects.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FolderIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No projects yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projects.slice(0, 4).map((p, i) => (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-bold">{p.title[0]}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">{p.title}</p>
                              <p className="text-xs text-gray-500 truncate">{p.tags?.slice(0, 2).join(', ')}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Recent Activity */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                      <ClockIcon className="w-5 h-5 text-cyan-500" />
                      Recent Activity
                    </h3>
                    <div className="space-y-4">
                      {recentActivity.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-4"
                        >
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white">{item.action}</p>
                            <p className="text-xs text-gray-500">{item.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <SparklesIcon className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Add Project', icon: PlusIcon },
                      { label: 'View Messages', icon: ChatBubbleLeftRightIcon },
                      { label: 'Edit Profile', icon: UserCircleIcon },
                      { label: 'View Site', icon: ArrowTopRightOnSquareIcon },
                    ].map((action) => (
                      <motion.button
                        key={action.label}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium flex flex-col items-center gap-2 transition-colors"
                      >
                        <action.icon className="w-6 h-6" />
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </Tab.Panel>

            {/* Projects Panel */}
            <Tab.Panel>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Projects ({projects.length})</h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(!showForm)}
                    className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                      showForm
                        ? 'bg-white/10 text-gray-300'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                    }`}
                  >
                    <PlusIcon className="w-5 h-5" />
                    {showForm ? 'Cancel' : 'Add Project'}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <form onSubmit={handleSubmitProject} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                            <input
                              type="text"
                              value={projectForm.title}
                              onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                            <input
                              type="text"
                              value={projectForm.tags}
                              onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                              placeholder="React, TypeScript"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                          <textarea
                            value={projectForm.description}
                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
                            <input
                              type="url"
                              value={projectForm.githubLink}
                              onChange={(e) => setProjectForm({ ...projectForm, githubLink: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Live URL</label>
                            <input
                              type="url"
                              value={projectForm.liveLink}
                              onChange={(e) => setProjectForm({ ...projectForm, liveLink: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
                          <div className="flex items-center gap-4">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 text-gray-300 transition-all"
                            >
                              <PhotoIcon className="w-5 h-5" />
                              Choose
                            </motion.button>
                            {imagePreview && <img src={imagePreview} alt="" className="h-16 w-24 object-cover rounded-xl border border-white/10" />}
                          </div>
                        </div>
                        <motion.button
                          type="submit"
                          disabled={submitting}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5" />
                          )}
                          {submitting ? 'Creating...' : 'Create Project'}
                        </motion.button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {projects.length === 0 ? (
                  <div className="text-center py-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                    <FolderIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 text-lg mb-2">No projects yet</p>
                    <p className="text-gray-500 text-sm">Create your first project to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {projects.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all flex items-center gap-5"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 flex items-center justify-center">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-3xl font-bold">{p.title[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg truncate">{p.title}</h3>
                          <p className="text-sm text-gray-400 truncate mb-2">{p.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {p.tags?.slice(0, 4).map((t, j) => (
                              <span key={j} className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-lg">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {p.liveLink && (
                            <motion.a
                              href={p.liveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                            >
                              <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400" />
                            </motion.a>
                          )}
                          {p.githubLink && (
                            <motion.a
                              href={p.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                            >
                              <CodeBracketIcon className="w-5 h-5 text-gray-400" />
                            </motion.a>
                          )}
                          <motion.button
                            onClick={() => handleDeleteProject(p.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all"
                          >
                            <TrashIcon className="w-5 h-5 text-red-400" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </Tab.Panel>

            {/* Messages Panel */}
            <Tab.Panel>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Messages ({messages.length})</h2>

                {messages.length === 0 ? (
                  <div className="text-center py-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                    <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 text-lg mb-2">No messages yet</p>
                    <p className="text-gray-500 text-sm">Messages from your contact form will appear here</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {messages.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                              {m.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white">{m.name}</p>
                              <p className="text-sm text-gray-500">{m.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.createdAt && (
                              <span className="text-xs text-gray-500">
                                {new Date(m.createdAt.seconds * 1000).toLocaleDateString()}
                              </span>
                            )}
                            <motion.button
                              onClick={() => handleDeleteMessage(m.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <TrashIcon className="w-4 h-4 text-red-400" />
                            </motion.button>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed pl-13">{m.message}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </Tab.Panel>

            {/* Settings Panel */}
            <Tab.Panel>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Settings</h2>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <PhotoIcon className="w-6 h-6 text-blue-500" />
                    Profile Image
                  </h3>

                  <AnimatePresence>
                    {profileSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-xl flex items-center gap-2"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        {profileSuccess}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="w-32 h-32 rounded-2xl overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center"
                    >
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <PhotoIcon className="w-12 h-12 text-gray-600" />
                      )}
                    </motion.div>
                    <div className="flex-1 space-y-4">
                      <p className="text-sm text-gray-400">Upload a profile image for your homepage. Recommended size: 400x400 pixels.</p>
                      <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                      <div className="flex gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => profileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 text-gray-300 transition-all"
                        >
                          <PhotoIcon className="w-5 h-5" />
                          Choose Image
                        </motion.button>
                        {profileImageBase64 && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveProfileImage}
                            disabled={savingProfile}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/30"
                          >
                            {savingProfile ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <CheckCircleIcon className="w-5 h-5" />
                            )}
                            Save
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <UserCircleIcon className="w-6 h-6 text-cyan-500" />
                    Account
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Email</span>
                      <span className="text-white">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Status</span>
                      <span className="text-green-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Active
                      </span>
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
