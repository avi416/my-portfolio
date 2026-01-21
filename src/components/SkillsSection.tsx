import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Skill {
  name: string;
  level: number;
  color: string;
}

interface SkillCategory {
  title: string;
  skills: Skill[];
}

const skillsData: SkillCategory[] = [
  {
    title: 'Frontend',
    skills: [
      { name: 'React', level: 90, color: 'from-cyan-500 to-blue-500' },
      { name: 'TypeScript', level: 85, color: 'from-blue-500 to-blue-600' },
      { name: 'Next.js', level: 80, color: 'from-blue-400 to-purple-500' },
      { name: 'Tailwind CSS', level: 95, color: 'from-cyan-400 to-cyan-600' },
      { name: 'HTML/CSS', level: 95, color: 'from-blue-500 to-purple-500' },
    ],
  },
  {
    title: 'Backend',
    skills: [
      { name: 'Node.js', level: 85, color: 'from-green-500 to-green-600' },
      { name: 'Express', level: 80, color: 'from-blue-500 to-cyan-500' },
      { name: 'MongoDB', level: 75, color: 'from-green-500 to-emerald-600' },
      { name: 'PostgreSQL', level: 70, color: 'from-blue-400 to-blue-600' },
      { name: 'REST API', level: 90, color: 'from-purple-500 to-pink-500' },
    ],
  },
  {
    title: 'Tools & Other',
    skills: [
      { name: 'Git', level: 90, color: 'from-orange-500 to-red-500' },
      { name: 'Docker', level: 65, color: 'from-blue-400 to-blue-600' },
      { name: 'AWS', level: 60, color: 'from-yellow-500 to-orange-500' },
      { name: 'Figma', level: 75, color: 'from-purple-500 to-pink-500' },
      { name: 'CI/CD', level: 70, color: 'from-blue-500 to-purple-600' },
    ],
  },
];

const SkillBar = ({ skill, index, isVisible }: { skill: Skill; index: number; isVisible: boolean }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setWidth(skill.level), 100 + index * 150);
      return () => clearTimeout(timer);
    }
  }, [isVisible, skill.level, index]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-300 font-medium">{skill.name}</span>
        <motion.span 
          className="text-blue-400 font-semibold"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          {width}%
        </motion.span>
      </div>
      <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${skill.color} rounded-full relative`}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 1, delay: index * 0.15, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 + index * 0.1 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

const SkillCard = ({ category, index, isVisible }: { category: SkillCategory; index: number; isVisible: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={isVisible ? { opacity: 1, y: 0 } : {}}
    transition={{ delay: index * 0.2, duration: 0.6 }}
    whileHover={{ y: -5 }}
    className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all"
  >
    <h3 className="text-xl font-bold text-white text-center mb-6">{category.title}</h3>
    {category.skills.map((skill, i) => (
      <SkillBar key={skill.name} skill={skill} index={i} isVisible={isVisible} />
    ))}
  </motion.div>
);

const SkillsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="skills" className="py-20">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">My Skills</h2>
          <motion.div
            className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"
            initial={{ width: 0 }}
            animate={isVisible ? { width: 64 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            Technologies and tools I work with
          </p>
        </motion.div>

        {/* Skills Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillsData.map((category, i) => (
            <SkillCard key={category.title} category={category} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
