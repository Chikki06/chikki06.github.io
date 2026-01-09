import React from 'react';
import { ExternalLink, Eye } from 'lucide-react';

export default function ProjectCard({ project, onClick }) {
  const gradientClasses = {
    blue: 'from-blue-500/5 to-cyan-500/5 border-blue-500/30 hover:border-blue-500/50',
    purple: 'from-purple-500/5 to-pink-500/5 border-purple-500/30 hover:border-purple-500/50',
    pink: 'from-pink-500/5 to-orange-500/5 border-pink-500/30 hover:border-pink-500/50',
    green: 'from-green-500/5 to-emerald-500/5 border-green-500/30 hover:border-green-500/50',
  };

  const textColorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    green: 'text-green-400',
  };

  const tagColorClasses = {
    blue: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
  };

  const gradient = gradientClasses[project.color] || gradientClasses.blue;
  const textColor = textColorClasses[project.color] || textColorClasses.blue;
  const tagColor = tagColorClasses[project.color] || tagColorClasses.blue;

  return (
    <div 
      className={`bg-gradient-to-br ${gradient} border rounded-2xl p-8 transition-all hover:scale-105 group cursor-pointer ${project.featured ? 'md:col-span-2' : ''}`}
      onClick={project.hasDetails ? onClick : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className={`text-2xl font-bold ${textColor}`}>{project.title}</h3>
        <div className="flex gap-2">
          {project.links && project.links.length > 0 && (
            <a 
              href={project.links[0].url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${textColor} hover:opacity-70 transition-opacity`}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-6 h-6" />
            </a>
          )}
        </div>
      </div>
      
      {project.subtitle && (
        <p className="text-gray-500 mb-4 text-sm">{project.subtitle}</p>
      )}
      
      <p className="text-gray-300 mb-6">
        {project.shortDescription}
      </p>

      {project.highlights && project.highlights.length > 0 && (
        <div className="mb-6 space-y-2">
          {project.highlights.map((highlight, idx) => (
            <p key={idx} className="text-gray-300 text-sm">
              {highlight}
            </p>
          ))}
        </div>
      )}

      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tech) => (
            <span key={tech} className={`px-3 py-1 ${tagColor} border rounded-full text-sm`}>
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
