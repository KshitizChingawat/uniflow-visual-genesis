
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-unilink-500 to-unilink-700 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">UniLink</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-unilink-600 transition-colors">Features</a>
            <a href="#compatibility" className="text-gray-700 hover:text-unilink-600 transition-colors">Compatibility</a>
            <a href="#security" className="text-gray-700 hover:text-unilink-600 transition-colors">Security</a>
            <a href="#pricing" className="text-gray-700 hover:text-unilink-600 transition-colors">Pricing</a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-gray-700 hover:text-unilink-600">
              Sign In
            </Button>
            <Button className="bg-unilink-600 hover:bg-unilink-700 text-white">
              Download
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-700 hover:text-unilink-600">Features</a>
              <a href="#compatibility" className="text-gray-700 hover:text-unilink-600">Compatibility</a>
              <a href="#security" className="text-gray-700 hover:text-unilink-600">Security</a>
              <a href="#pricing" className="text-gray-700 hover:text-unilink-600">Pricing</a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" className="justify-start">Sign In</Button>
                <Button className="bg-unilink-600 hover:bg-unilink-700 text-white">Download</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
