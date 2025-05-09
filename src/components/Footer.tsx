import React from 'react';
import { Instagram, MessageCircle, Heart, CreditCard, ShieldCheck, Facebook, Youtube } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();
  
  const scrollToSection = (id: string) => {
    // Check if we're on the landing page
    if (location.pathname === '/') {
      // We're on the landing page, try to scroll to the section
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // We're not on the landing page, navigate to the landing page with the hash
      navigate(`/#${id}`);
    }
  };

  const goToHome = () => {
    // Always navigate to the home page
    navigate('/');
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4 text-red-500">Menú</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => scrollToSection('menu')} 
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  Menú
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('paquetes')} 
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  Selecciona Paquete
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('como-funciona')} 
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  ¿Cómo Funciona?
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('faqs')} 
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  FAQs
                </button>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4 text-red-500">Síguenos</h3>
            <div className="flex space-x-4 flex-wrap">
              <a href="https://www.instagram.com/lacantinaxl" className="hover:text-red-500 mb-2" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-8 h-8" />
              </a>
              <a href="http://wa.me/+5350441098" className="hover:text-red-500 mb-2" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-8 h-8" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61574076167568" className="hover:text-red-500 mb-2" target="_blank" rel="noopener noreferrer">
                <Facebook className="w-8 h-8" />
              </a>
              <a href="https://www.youtube.com/@CantinaXL-Cuba" className="hover:text-red-500 mb-2" target="_blank" rel="noopener noreferrer">
                <Youtube className="w-8 h-8" />
              </a>
              <a href="https://www.tiktok.com/@cantinaxl" className="hover:text-red-500 mb-2" target="_blank" rel="noopener noreferrer">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  shape-rendering="geometricPrecision" 
                  text-rendering="geometricPrecision" 
                  image-rendering="optimizeQuality" 
                  fill-rule="evenodd" 
                  clip-rule="evenodd" 
                  viewBox="0 0 449.45 515.38" 
                  className="w-6 h-6"
                  fill="currentColor"
                  style={{ margin: '4px' }}
                >
                  <path 
                    fill-rule="nonzero" 
                    d="M382.31 103.3c-27.76-18.1-47.79-47.07-54.04-80.82-1.35-7.29-2.1-14.8-2.1-22.48h-88.6l-.15 355.09c-1.48 39.77-34.21 71.68-74.33 71.68-12.47 0-24.21-3.11-34.55-8.56-23.71-12.47-39.94-37.32-39.94-65.91 0-41.07 33.42-74.49 74.48-74.49 7.67 0 15.02 1.27 21.97 3.44V190.8c-7.2-.99-14.51-1.59-21.97-1.59C73.16 189.21 0 262.36 0 352.3c0 55.17 27.56 104 69.63 133.52 26.48 18.61 58.71 29.56 93.46 29.56 89.93 0 163.08-73.16 163.08-163.08V172.23c34.75 24.94 77.33 39.64 123.28 39.64v-88.61c-24.75 0-47.8-7.35-67.14-19.96z"
                  />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4 text-red-500">Pago Seguro</h3>
            <ul className="space-y-2">
              <li className="text-gray-300 hover:text-red-500 transition-colors">VISA</li>
              <li className="text-gray-300 hover:text-red-500 transition-colors">MASTERCARD</li>
              <li className="text-gray-300 hover:text-red-500 transition-colors">AMEX</li>
              <li className="text-gray-300 hover:text-red-500 transition-colors">TROPIPAY</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="https://spauqltlvfrjmfrghpgk.supabase.co/storage/v1/object/public/site-media//cantinaxl-subtitle-blanco.png" 
              alt="LaCantinaXL Logo" 
              className="h-24 w-auto object-contain cursor-pointer"
              onClick={goToHome}
            />
          </div>
          <p className="text-gray-400">
            &copy; {currentYear} Cantina XL. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
