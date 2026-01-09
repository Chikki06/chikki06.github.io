import React from 'react';
import { Cpu, Zap, Code } from 'lucide-react';

export default function About() {
  return (
    <section id="about" className="min-h-screen flex items-center px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-5xl font-bold mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          About Me
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 hover:scale-105 transition-transform">
            <Cpu className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Deep Learning</h3>
            <p className="text-gray-400">Specialized in computer vision and neural network optimization</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-transform">
            <Zap className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Performance</h3>
            <p className="text-gray-400">Achieved 99% reduction in processing time through optimization</p>
          </div>
          
          <div className="bg-gradient-to-br from-pink-500/10 to-blue-500/10 border border-pink-500/30 rounded-2xl p-6 hover:scale-105 transition-transform">
            <Code className="w-12 h-12 text-pink-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Full Stack</h3>
            <p className="text-gray-400">End-to-end deployment from ML models to production systems</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-2xl p-8">
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            I'm a sophomore at UIUC passionate about pushing the boundaries of what's possible with AI and computer vision. 
            Currently working on virtual staining models that enable real-time histological inference, I've delivered measurable impact 
            through architectural optimizations and deployment engineering.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            From achieving 45% faster inference speeds to building custom protocols for 10x performance gains, 
            I thrive on solving complex technical challenges and bringing cutting-edge research into production.
          </p>
        </div>
      </div>
    </section>
  );
}
