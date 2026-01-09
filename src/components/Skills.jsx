import React from 'react';

export default function Skills() {
  return (
    <section id="skills" className="min-h-screen flex items-center px-6 py-20">
      <div className="max-w-5xl mx-auto w-full">
        <h2 className="text-5xl font-bold mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Technical Arsenal
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-blue-400 mb-6">Languages</h3>
            <div className="flex flex-wrap gap-3">
              {['Python', 'C++', 'Java', 'C', 'JavaScript', 'Rust'].map((lang) => (
                <span key={lang} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-purple-400 mb-6">ML/AI</h3>
            <div className="flex flex-wrap gap-3">
              {['PyTorch', 'TensorFlow', 'ONNX', 'TensorRT', 'Computer Vision', 'Deep Learning'].map((tech) => (
                <span key={tech} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-colors">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500/5 to-orange-500/5 border border-pink-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-pink-400 mb-6">Tools & Platforms</h3>
            <div className="flex flex-wrap gap-3">
              {['Flask', 'Docker', 'Linux', 'AWS', 'Azure', 'Firebase', 'gRPC', 'NGINX', 'Git'].map((tool) => (
                <span key={tool} className="px-4 py-2 bg-pink-500/10 border border-pink-500/30 rounded-lg text-pink-400 hover:bg-pink-500/20 transition-colors">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6">Languages</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">English</span>
                <span className="text-cyan-400">Fluent</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Hindi</span>
                <span className="text-cyan-400">Fluent</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">German</span>
                <span className="text-cyan-400">Professional</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
