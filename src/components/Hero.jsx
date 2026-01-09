import React from 'react';
import { Mail, Linkedin, Github, ChevronDown } from 'lucide-react';

export default function Hero() {
  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative px-6 pt-20">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-block mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm animate-pulse">
          Available for Opportunities
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-fade-in">
          Akshat Kumar Shahi
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-4">
          Computer Science @ UIUC
        </p>
        
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          Building intelligent systems at the intersection of deep learning and computer vision.
          Transforming complex problems into elegant solutions.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <a href="mailto:Akshatshahi2006@gmail.com" className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-full transition-all hover:scale-110">
            <Mail className="w-6 h-6" />
          </a>
          <a href="https://www.linkedin.com/in/akshat-shahi-651684217/" target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-full transition-all hover:scale-110">
            <Linkedin className="w-6 h-6" />
          </a>
          <a href="https://github.com/Chikki06" target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-full transition-all hover:scale-110">
            <Github className="w-6 h-6" />
          </a>
        </div>

        <button 
          onClick={scrollToAbout}
          className="animate-bounce"
        >
          <ChevronDown className="w-8 h-8 text-blue-400" />
        </button>
      </div>
    </section>
  );
}
