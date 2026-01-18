import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';

const techStack = ['React', 'TypeScript', 'Node.js', 'Firebase', 'Tailwind', 'AWS', 'MongoDB', 'Next.js', 'GraphQL', 'Docker'];
const skills = ['Frontend Development', 'Backend Development', 'Database Design', 'API Integration', 'Cloud Services', 'UI/UX Design'];

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  githubLink: string;
  liveLink: string;
}

const TechCarousel = () => {
  const duplicated = [...techStack, ...techStack];
  return (
    <div className="relative overflow-hidden py-4 max-w-md lg:max-w-lg">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-900 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-900 to-transparent z-10" />
      <motion.div className="flex gap-3 w-max" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 15, ease: 'linear', repeat: Infinity }}>
        {duplicated.map((tech, i) => (
          <span key={i} className="px-3 py-1.5 bg-white/10 border border-white/20 text-gray-300 rounded-full text-xs font-medium whitespace-nowrap">{tech}</span>
        ))}
      </motion.div>
    </div>
  );
};

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const HomePage = () => {
  const [profileImage, setProfileImage] = useState<string>('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'settings', 'profile'));
        if (profileDoc.exists() && profileDoc.data().profileImageBase64) setProfileImage(profileDoc.data().profileImageBase64);
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
      } catch (error) { console.error('Error:', error); }
    };
    fetchData();
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-pink-500 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* HERO SECTION */}
      <section id="home" className="min-h-screen flex items-center justify-center pt-20 pb-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
            <div className="text-center lg:text-left order-2 lg:order-1 max-w-lg">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium border border-purple-500/30">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Available for work
                </span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Avi Mahari</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg sm:text-xl text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
                A passionate <span className="text-purple-400 font-semibold">Full-Stack Developer</span> crafting beautiful digital experiences.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <button onClick={() => scrollTo('projects')} className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  View My Work
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
                <button onClick={() => scrollTo('contact')} className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all hover:-translate-y-1">
                  Get In Touch
                </button>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider">Tech Stack</p>
                <TechCarousel />
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex-shrink-0 relative order-1 lg:order-2">
              <div className="absolute inset-0 -m-12 rounded-full bg-gradient-to-br from-purple-600/50 to-blue-500/50 blur-3xl" />
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                <img src={profileImage} alt="Avi Mahari" className="w-full h-full object-cover" />
              </div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-2 -right-2 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20"><span className="text-2xl">🚀</span></motion.div>
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} className="absolute -bottom-2 -left-2 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20"><span className="text-2xl">💻</span></motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
            {/* Left - Services */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 border border-purple-500/50 rounded-xl bg-purple-500/10">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <span className="text-white font-medium text-lg">Website Development</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 border border-purple-500/50 rounded-xl bg-purple-500/10">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-white font-medium text-lg">App Development</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 border border-purple-500/50 rounded-xl bg-purple-500/10">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <span className="text-white font-medium text-lg">Software Solutions</span>
              </div>
            </motion.div>

            {/* Right - About Text & Stats */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-lg">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">About me</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                My journey into tech began with a curiosity for how things work. What started as tinkering with code evolved into a deep passion for building digital solutions. Today, I specialize in creating seamless web experiences that combine functionality with beautiful design.
              </p>
              
              {/* What I Bring */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="text-gray-300 text-sm">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  <span className="text-gray-300 text-sm">Creative Solutions</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="text-gray-300 text-sm">Clean Code</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                  <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  <span className="text-gray-300 text-sm">Pixel Perfect</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <span className="text-gray-300 text-sm">24/7 Support</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-32" />

      {/* PROJECTS SECTION */}
      <section id="projects" className="py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Title with underline */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Projects</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
          </motion.div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <p className="text-center text-gray-400">No projects yet. Add some from the admin dashboard!</p>
          ) : (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.slice(0, 3).map((project, i) => (
                  <motion.div key={project.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="group bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all">
                    {/* Image with Featured badge */}
                    <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                      <span className="absolute top-3 left-3 z-10 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold rounded-full">Featured</span>
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600">
                          <span className="text-white text-3xl font-bold italic">{project.title}</span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                      {/* Category tag */}
                      <div className="mb-3">
                        <span className="px-3 py-1 border border-cyan-500/50 text-cyan-400 rounded-full text-xs font-medium">
                          {project.tags?.[0] || 'Web App'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>
                      {/* Tech stack */}
                      <div className="flex flex-wrap gap-2">
                        {project.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full text-xs">{tag}</span>
                        ))}
                        {project.tags && project.tags.length > 3 && (
                          <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full text-xs">+{project.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* View All Projects Button */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-10">
                <a href="/projects" className="inline-flex items-center gap-2 px-8 py-3 border-2 border-purple-500 text-purple-400 font-semibold rounded-full hover:bg-purple-500/10 transition-all">
                  View All Projects
                </a>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Spacer */}
      <div className="h-32" />

      {/* CONTACT SECTION */}
      <section id="contact" className="py-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Get In Touch</h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-4">Have a project in mind or want to collaborate? Feel free to reach out!</p>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
            {/* Left - Contact Info */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6 w-full max-w-sm">
              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-500/20 rounded-2xl">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Email</h4>
                  <p className="text-gray-400">contact@avimahari.com</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-500/20 rounded-2xl">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Location</h4>
                  <p className="text-gray-400">Israel</p>
                </div>
              </div>

              {/* Available for work badge */}
              <div className="mt-8 p-5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 font-semibold">Available for work</span>
                </div>
                <p className="text-gray-400 text-sm">I'm currently accepting new projects and collaborations.</p>
              </div>

              {/* Social Links */}
              <div className="flex gap-4 pt-4">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-purple-500/20 hover:border-purple-500/30 transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-purple-500/20 hover:border-purple-500/30 transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-purple-500/20 hover:border-purple-500/30 transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></a>
              </div>
            </motion.div>

            {/* Right - Contact Form */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="w-full max-w-sm">
              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Name</label>
                    <input type="text" placeholder="Your name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition" />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Email</label>
                    <input type="email" placeholder="example@email.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Subject</label>
                  <input type="text" placeholder="What's this about?" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition" />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Message</label>
                  <textarea rows={5} placeholder="Tell me about your project..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition resize-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  Send Message
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="relative mt-16 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Brand */}
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">Avi Mahari</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-md">Full-Stack Developer passionate about creating beautiful and functional digital experiences.</p>
            
            {/* Quick Links */}
            <div className="flex justify-center gap-6 mb-6">
              <button onClick={() => scrollTo('home')} className="text-gray-400 hover:text-purple-400 transition-colors text-sm">Home</button>
              <button onClick={() => scrollTo('about')} className="text-gray-400 hover:text-purple-400 transition-colors text-sm">About</button>
              <button onClick={() => scrollTo('projects')} className="text-gray-400 hover:text-purple-400 transition-colors text-sm">Projects</button>
              <button onClick={() => scrollTo('contact')} className="text-gray-400 hover:text-purple-400 transition-colors text-sm">Contact</button>
            </div>
            
            {/* Social */}
            <div className="flex justify-center gap-3 mb-8">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
            
            {/* Bottom Bar */}
            <div className="pt-6 border-t border-white/10 w-full max-w-md">
              <p className="text-gray-500 text-sm mb-1">© 2026 Avi Mahari. All rights reserved.</p>
              <p className="text-gray-600 text-xs">Built with React, TypeScript & Tailwind CSS</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
