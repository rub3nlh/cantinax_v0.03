import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get return path and order data from location state
  const returnTo = location.state?.returnTo || '/';
  const orderData = location.state?.orderData;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsLoading(true);
      await signIn(email, password);
      // Navigate back to the return path with order data if it exists
      navigate(returnTo, { state: orderData });
    } catch (err) {
      console.error('Error during login:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <h1 className="text-3xl font-bold text-center mb-8">Iniciar sesión</h1>


              <form onSubmit={handleEmailLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-600">
                      <p className="font-medium">{error}</p>
                      {error === 'Su email no ha sido confirmado' && (
                        <p className="mt-1">
                          Por favor, revisa tu correo electrónico y haz clic en el enlace de confirmación.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Contraseña
                    </label>
                    <Link to="/forgot-password" className="text-sm text-red-500 hover:text-red-600">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link 
                  to="/signup" 
                  state={location.state} // Pass the same state to preserve order data
                  className="text-red-500 hover:text-red-600 font-medium"
                >
                  Regístrate
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
