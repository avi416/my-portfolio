import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  githubLink: string;
  liveLink: string;
}

// Project Card Component with iframe preview and fallback
const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleCardClick = () => {
    if (project.liveLink) {
      window.open(project.liveLink, '_blank');
    }
  };

  const showIframe = project.liveLink && !iframeError;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.01 }}
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-gray-800/50 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/20 backdrop-blur-sm border border-gray-100 dark:border-gray-800 cursor-pointer"
    >
      {/* Preview Area - Iframe or Thumbnail */}
      <div className="relative aspect-video overflow-hidden border-b border-gray-100 dark:border-gray-800">
        {showIframe ? (
          <>
            {/* Loading placeholder */}
            {!iframeLoaded && (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <iframe
              src={project.liveLink}
              title={project.title}
              className={`w-full h-full border-0 pointer-events-none transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeError(true)}
            />
            {/* Overlay to prevent iframe interaction */}
            <div className="absolute inset-0 bg-transparent" />
          </>
        ) : project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-5xl font-bold opacity-50">{project.title.charAt(0)}</span>
          </div>
        )}
        
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
        
        {/* Quick actions on hover */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-3 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
          {project.liveLink && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(project.liveLink, '_blank'); }}
              className="flex-1 px-4 py-2.5 bg-white text-gray-900 font-medium rounded-xl text-center text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit Site
            </button>
          )}
          {project.githubLink && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(project.githubLink, '_blank'); }}
              className="p-2.5 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </button>
          )}
        </div>

        {/* Live indicator */}
        {showIframe && iframeLoaded && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 text-white text-xs font-medium rounded-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800/50"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const allTags = ['All', ...new Set(projects.flatMap(p => p.tags || []))];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const filteredProjects = filter === 'All' 
    ? projects 
    : projects.filter(p => p.tags?.includes(filter));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full" />
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 mt-8">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-7xl mx-auto space-y-12 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-2 bg-purple-500/10 text-purple-500 dark:text-purple-400 rounded-full text-sm font-medium mb-6"
          >
            🚀 My Work
          </motion.span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Featured{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Projects
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A showcase of my best work, from web applications to mobile apps. Each project represents a unique challenge and solution.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        {projects.length > 0 && allTags.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {allTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                  filter === tag
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="text-4xl">🚧</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xl mb-2">
              No projects yet
            </p>
            <p className="text-gray-400 dark:text-gray-500">
              Check back soon for exciting new projects!
            </p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
