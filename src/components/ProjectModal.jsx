import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Youtube, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProjectModal({ project, isOpen, onClose }) {
  const [isTldr, setIsTldr] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                {project.title}
              </h2>
              {project.subtitle && (
                <p className="text-gray-400 text-sm">{project.subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* TL;DR Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Detailed View</span>
            <button
              onClick={() => setIsTldr(!isTldr)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isTldr ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isTldr ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-400">TL;DR</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 pb-12">
          {/* Links */}
          {project.links && project.links.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {project.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors text-blue-400"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Overview */}
          {project.overview && (
            <div className="mb-8">
              <button
                onClick={() => toggleSection('overview')}
                className="w-full flex items-center justify-between text-2xl font-bold text-white mb-4 hover:text-blue-400 transition-colors"
              >
                <span>Overview</span>
                {collapsedSections.overview ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
              </button>
              {!collapsedSections.overview && (
                <div className="prose prose-invert max-w-none">
                  {isTldr ? (
                    <ul className="space-y-3 ml-5">
                      {(project.highlights || (Array.isArray(project.overview) ? project.overview : [project.overview])).map((highlight, idx) => {
                        const text = typeof highlight === 'string' ? highlight : String(highlight);
                        return (
                          <li key={idx} className="text-gray-300 leading-relaxed">
                            {text}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    Array.isArray(project.overview) ? (
                      project.overview.map((paragraph, idx) => (
                        <p key={idx} className="text-gray-300 mb-4">{paragraph}</p>
                      ))
                    ) : (
                      <p className="text-gray-300">{project.overview}</p>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Architecture Sections */}
          {project.architectureSections && project.architectureSections.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => toggleSection('architecture')}
                className="w-full flex items-center justify-between text-2xl font-bold text-white mb-6 hover:text-blue-400 transition-colors"
              >
                <span>Architecture & Design</span>
                {collapsedSections.architecture ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
              </button>
              {!collapsedSections.architecture && (
                <div className="space-y-6">
                  {project.architectureSections.map((section, idx) => (
                    <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-xl font-bold text-blue-400 mb-3">{section.title}</h4>
                      
                      {isTldr ? (
                        <div className="space-y-4">
                          {section.content && (
                            <p className="text-gray-300 mb-4">{section.content}</p>
                          )}
                          {section.subsections?.slice(0, 4).map((subsection, sIdx) => (
                            <div key={sIdx} className="ml-4">
                              <h5 className="text-cyan-400 font-semibold mb-2">{subsection.title}</h5>
                              {subsection.content && (
                                <p className="text-gray-300 text-sm mb-2 ml-2">{subsection.content}</p>
                              )}
                              {subsection.points && subsection.points.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 text-gray-300 ml-2">
                                  {subsection.points.slice(0, 4).map((point, pIdx) => (
                                    <li key={pIdx} className="text-sm">{point}</li>
                                  ))}
                                  {subsection.points.length > 4 && (
                                    <li className="text-sm text-gray-500 italic">+ {subsection.points.length - 4} more details...</li>
                                  )}
                                </ul>
                              ) : subsection.content ? null : (
                                <p className="text-gray-300 text-sm ml-2">{subsection.content}</p>
                              )}
                            </div>
                          )) || (
                            section.points && section.points.length > 0 ? (
                              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                {section.points.slice(0, 5).map((point, pIdx) => (
                                  <li key={pIdx}>{point}</li>
                                ))}
                                {section.points.length > 5 && (
                                  <li className="text-gray-500 italic">+ {section.points.length - 5} more...</li>
                                )}
                              </ul>
                            ) : (
                              <p className="text-gray-300">{section.content}</p>
                            )
                          )}
                          {section.subsections && section.subsections.length > 4 && (
                            <p className="text-gray-500 italic text-sm ml-4">+ {section.subsections.length - 4} more subsections in detailed view</p>
                          )}
                        </div>
                      ) : (
                        <>
                          {section.content && (
                            <div className="prose prose-invert max-w-none mb-4">
                              {Array.isArray(section.content) ? (
                                section.content.map((item, cIdx) => (
                                  <p key={cIdx} className="text-gray-300 mb-3">{item}</p>
                                ))
                              ) : (
                                <p className="text-gray-300">{section.content}</p>
                              )}
                            </div>
                          )}
                          
                          {section.points && section.points.length > 0 && (
                            <ul className="list-disc list-inside space-y-2 text-gray-300">
                              {section.points.map((point, pIdx) => (
                                <li key={pIdx}>{point}</li>
                              ))}
                            </ul>
                          )}
                          
                          {section.subsections && section.subsections.length > 0 && (
                            <div className="mt-4 space-y-4">
                              {section.subsections.map((subsection, sIdx) => (
                                <div key={sIdx} className="ml-4 border-l-2 border-gray-600 pl-4">
                                  <h5 className="text-lg font-semibold text-cyan-400 mb-2">{subsection.title}</h5>
                                  {subsection.content && (
                                    <p className="text-gray-300 mb-2">{subsection.content}</p>
                                  )}
                                  {subsection.points && subsection.points.length > 0 && (
                                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                      {subsection.points.map((point, pIdx) => (
                                        <li key={pIdx}>{point}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {subsection.images && subsection.images.length > 0 && (
                                    <div className="mt-4 space-y-6">
                                      {subsection.images.map((image, imgIdx) => (
                                        <div key={imgIdx} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                          <img 
                                            src={image.src} 
                                            alt={image.alt}
                                            className="w-full rounded-lg mb-2"
                                          />
                                          {image.caption && (
                                            <p className="text-gray-400 text-sm text-center italic">{image.caption}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {project.timeline && project.timeline.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => toggleSection('timeline')}
                className="w-full flex items-center justify-between text-2xl font-bold text-white mb-6 hover:text-blue-400 transition-colors"
              >
                <span>Project Evolution</span>
                {collapsedSections.timeline ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
              </button>
              {!collapsedSections.timeline && (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>
                
                <div className="space-y-8 ml-8">
                  {project.timeline.map((phase, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-gray-900"></div>
                      
                      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
                        <h4 className="text-xl font-bold text-purple-400 mb-2">{phase.title}</h4>
                        
                        {!isTldr && phase.videoUrl && (
                          <div className="mb-4 rounded-lg overflow-hidden border border-gray-700">
                            <div className="relative pt-[56.25%]">
                              <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={phase.videoUrl}
                                title={phase.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          </div>
                        )}
                        
                        {phase.description && (
                          <p className="text-gray-300 mb-4">{phase.description}</p>
                        )}
                        
                        {phase.features && phase.features.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-400 mb-2">Key Features:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-300">
                              {(isTldr ? phase.features.slice(0, 5) : phase.features).map((feature, fIdx) => (
                                <li key={fIdx} className="text-sm">{feature}</li>
                              ))}
                              {isTldr && phase.features.length > 5 && (
                                <li className="text-sm text-gray-500 italic">+ {phase.features.length - 5} more in detailed view</li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {phase.technologies && phase.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {(isTldr ? phase.technologies.slice(0, 6) : phase.technologies).map((tech, tIdx) => (
                              <span key={tIdx} className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400">
                                {tech}
                              </span>
                            ))}
                            {isTldr && phase.technologies.length > 6 && (
                              <span className="px-2 py-1 text-xs text-gray-500 italic">+{phase.technologies.length - 6} more</span>
                            )}
                          </div>
                        )}
                        
                        {!isTldr && phase.limitations && phase.limitations.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-red-400 mb-2">Limitations:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-400">
                              {phase.limitations.map((limitation, lIdx) => (
                                <li key={lIdx} className="text-sm">{limitation}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}

          {/* Key Features */}
          {project.keyFeatures && project.keyFeatures.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => toggleSection('features')}
                className="w-full flex items-center justify-between text-2xl font-bold text-white mb-4 hover:text-blue-400 transition-colors"
              >
                <span>Key Features</span>
                {collapsedSections.features ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
              </button>
              {!collapsedSections.features && (
              <div className="grid md:grid-cols-2 gap-4">
                {project.keyFeatures.map((feature, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-400 mb-2">{feature.title}</h4>
                    <p className="text-gray-300 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Impact & Results */}
          {project.impact && (
            <div className="mb-8">
              <button
                onClick={() => toggleSection('impact')}
                className="w-full flex items-center justify-between text-2xl font-bold text-white mb-4 hover:text-blue-400 transition-colors"
              >
                <span>Impact & Results</span>
                {collapsedSections.impact ? <ChevronDown className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
              </button>
              {!collapsedSections.impact && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                {project.impact.achievements && project.impact.achievements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-green-400 mb-3">Technical Achievements</h4>
                    <ul className="space-y-2">
                      {project.impact.achievements.map((achievement, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-300">
                          <span className="text-green-400 mt-1">✓</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {project.impact.metrics && project.impact.metrics.length > 0 && (
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    {project.impact.metrics.map((metric, idx) => (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-400 mb-1">{metric.value}</div>
                        <div className="text-sm text-gray-400">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('technologies')}
                className="w-full flex items-center justify-between text-xl font-bold text-white mb-4 hover:text-blue-400 transition-colors"
              >
                <span>Technologies & Tools</span>
                {collapsedSections.technologies ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
              {!collapsedSections.technologies && (
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400">
                    {tech}
                  </span>
                ))}
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
