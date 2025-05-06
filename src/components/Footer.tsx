import React from 'react';
import { Instagram, MessageCircle, Heart, CreditCard, ShieldCheck } from 'lucide-react';
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

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4">Menú</h3>
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
            <h3 className="text-2xl font-bold mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/lacantinaxl" className="hover:text-red-500" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-8 h-8" />
              </a>
              <a href="http://wa.me/+5350441098" className="hover:text-red-500" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-8 h-8" />
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4">Pago Seguro</h3>
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
              src="https://spauqltlvfrjmfrghpgk.supabase.co/storage/v1/object/public/site-media//cantinaxl.png" 
              alt="LaCantinaXL Logo" 
              className="h-16 w-auto object-contain"
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
