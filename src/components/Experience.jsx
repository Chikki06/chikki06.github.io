import React from 'react';

export default function Experience() {
  return (
    <section id="experience" className="min-h-screen flex items-center px-6 py-20">
      <div className="max-w-5xl mx-auto w-full">
        <h2 className="text-5xl font-bold mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Experience
        </h2>

        <div className="space-y-8">
          {/* UIUC Research */}
          <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  Chemical Imaging and Structures Laboratory, UIUC
                </h3>
                <p className="text-gray-400 mt-1">Undergraduate Research Assistant</p>
              </div>
              <span className="text-gray-500">Sep 2024 - Present</span>
            </div>

            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">▹</span>
                <p>Developing Virtual Stain Lite Generator model enabling real-time histological staining inference</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">▹</span>
                <p>Improved virtual staining inference speeds by <span className="text-blue-400 font-semibold">45%</span> through architectural refinements to a U-Net in PyTorch</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">▹</span>
                <p>Cut data processing time by <span className="text-blue-400 font-semibold">99%</span> (days to 5 minutes) by building synchronous desktop app</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">▹</span>
                <p>Engineered custom FTP via TCP sockets enabling <span className="text-blue-400 font-semibold">10x</span> faster disk-operation free inference</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              {['PyTorch', 'ONNX', 'TensorRT', 'Flask', 'AWS', 'Azure', 'NGINX'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Machani Robotics */}
          <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/30 rounded-2xl p-8 hover:border-purple-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                  Machani Robotics
                </h3>
                <p className="text-gray-400 mt-1">Robotics Intern</p>
              </div>
              <span className="text-gray-500">Jun 2023 - Aug 2023</span>
            </div>

            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">▹</span>
                <p>Developed gRPC microservices for API handling and testing using Postman</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">▹</span>
                <p>Developed facial animation for Ria humanoid robot using Python and Cereproc TTS within Docker environment</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">▹</span>
                <p>Collaborated with 20 engineers on facial detection and tracking features using PyTorch</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              {['Python', 'gRPC', 'Docker', 'PyTorch', 'Postman'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm text-purple-400">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
