import React from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar({ scrollToSection, mobileMenuOpen, setMobileMenuOpen }) {
  const menuItems = ['About', 'Experience', 'Projects', 'Skills', 'Contact'];

  const handleClick = (item) => {
    scrollToSection(item.toLowerCase());
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-black/50 border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => scrollToSection('hero')} 
          className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
        >
          AKS
        </button>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => handleClick(item)}
              className="hover:text-blue-400 transition-colors duration-300 relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-blue-500/20">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => handleClick(item)}
              className="block w-full text-left px-6 py-3 hover:bg-blue-500/10 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
