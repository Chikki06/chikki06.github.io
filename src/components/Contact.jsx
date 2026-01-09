import React from 'react';
import { Mail, Linkedin } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="min-h-screen flex items-center px-6 py-20">
      <div className="max-w-3xl mx-auto w-full text-center">
        <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Let's Build Something Useful
        </h2>
        
        <p className="text-xl text-gray-400 mb-12">
          I'm always open to discussing new projects, suggestions to improve current ones or opportunities to be part of your visions.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <a 
            href="mailto:Akshatshahi2006@gmail.com"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-semibold hover:scale-110 transition-transform flex items-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Get In Touch
          </a>
          
          <a 
            href="https://www.linkedin.com/in/akshat-shahi-651684217/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/5 border border-blue-500/30 rounded-full font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Linkedin className="w-5 h-5" />
            LinkedIn
          </a>
        </div>

        <div className="mt-16 text-gray-500">
          <p>University of Illinois Urbana-Champaign</p>
          <p>B.S. Computer Science | Mathematics Minor</p>
        </div>
      </div>
    </section>
  );
}
