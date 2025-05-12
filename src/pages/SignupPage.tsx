import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, CheckCircle, User, Phone, ChevronDown, Search } from 'lucide-react';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useGeoLocation } from '../hooks/useGeoLocation';

const COUNTRIES_ISO = [
  { code: 'ES', name: 'España' },
  { code: 'CU', name: 'Cuba' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'DE', name: 'Alemania' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CA', name: 'Canadá' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'KR', name: 'Corea del Sur' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egipto' },
  { code: 'FR', name: 'Francia' },
  { code: 'GR', name: 'Grecia' },
  { code: 'NL', name: 'Holanda' },
  { code: 'HU', name: 'Hungría' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'IT', name: 'Italia' },
  { code: 'JP', name: 'Japón' },
  { code: 'MX', name: 'México' },
  { code: 'NO', name: 'Noruega' },
  { code: 'NZ', name: 'Nueva Zelanda' },
  { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Perú' },
  { code: 'PL', name: 'Polonia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'RU', name: 'Rusia' },
  { code: 'SE', name: 'Suecia' },
  { code: 'CH', name: 'Suiza' },
  { code: 'TW', name: 'Taiwán' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'VE', name: 'Venezuela' }
].sort((a, b) => a.name.localeCompare(b.name));

const COUNTRY_CODES = [
  { code: '+34', country: 'España' },
  { code: '+53', country: 'Cuba' },
  { code: '+1', country: 'Estados Unidos' },
  { code: '+49', country: 'Alemania' },
  { code: '+54', country: 'Argentina' },
  { code: '+61', country: 'Australia' },
  { code: '+32', country: 'Bélgica' },
  { code: '+55', country: 'Brasil' },
  { code: '+1', country: 'Canadá' },
  { code: '+56', country: 'Chile' },
  { code: '+86', country: 'China' },
  { code: '+57', country: 'Colombia' },
  { code: '+82', country: 'Corea del Sur' },
  { code: '+45', country: 'Dinamarca' },
  { code: '+593', country: 'Ecuador' },
  { code: '+20', country: 'Egipto' },
  { code: '+33', country: 'Francia' },
  { code: '+30', country: 'Grecia' },
  { code: '+31', country: 'Holanda' },
  { code: '+36', country: 'Hungría' },
  { code: '+91', country: 'India' },
  { code: '+62', country: 'Indonesia' },
  { code: '+353', country: 'Irlanda' },
  { code: '+39', country: 'Italia' },
  { code: '+81', country: 'Japón' },
  { code: '+52', country: 'México' },
  { code: '+47', country: 'Noruega' },
  { code: '+64', country: 'Nueva Zelanda' },
  { code: '+507', country: 'Panamá' },
  { code: '+595', country: 'Paraguay' },
  { code: '+51', country: 'Perú' },
  { code: '+48', country: 'Polonia' },
  { code: '+351', country: 'Portugal' },
  { code: '+44', country: 'Reino Unido' },
  { code: '+7', country: 'Rusia' },
  { code: '+46', country: 'Suecia' },
  { code: '+41', country: 'Suiza' },
  { code: '+886', country: 'Taiwán' },
  { code: '+598', country: 'Uruguay' },
  { code: '+58', country: 'Venezuela' }
].sort((a, b) => a.country.localeCompare(b.country));

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const { country_code, loading: geoLoading } = useGeoLocation();
  
  // Get return path and order data from location state
  const returnTo = location.state?.returnTo || '/';
  const orderData = location.state?.orderData;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryCodeList, setShowCountryCodeList] = useState(false);
  const [searchCountryCodeQuery, setSearchCountryCodeQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load email from localStorage if available
  useEffect(() => {
    const userInfo = localStorage.getItem('lacantinaxl_user_info');
    if (userInfo) {
      const { email, name } = JSON.parse(userInfo);
      if (email) setEmail(email);
      if (name) {
        const nameParts = name.split(' ');
        if (nameParts.length > 1) {
          setFirstName(nameParts[0]);
          setLastName(nameParts.slice(1).join(' '));
        } else {
          setFirstName(name);
        }
      }
    }
  }, []);

  // Set country based on IP geolocation
  useEffect(() => {
    if (!geoLoading && country_code) {
      // Find matching country in our list
      const matchingCountry = COUNTRIES_ISO.find(c => c.code === country_code);
      if (matchingCountry) {
        // Find matching country code
        const matchingCountryName = matchingCountry.name;
        const matchingCode = COUNTRY_CODES.find(c => c.country === matchingCountryName);
        if (matchingCode) {
          setSelectedCountryCode(matchingCode);
        }
        
        console.log(`🌍 Preselected country: ${matchingCountry.name}`);
      }
    }
  }, [country_code, geoLoading]);

  const validatePhoneNumber = (value: string) => {
    // Only allow numbers
    return value.replace(/[^\d]/g, '');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validatedNumber = validatePhoneNumber(e.target.value);
    setPhoneNumber(validatedNumber);
  };

  const filteredCountryCodes = COUNTRY_CODES.filter(country =>
    country.country.toLowerCase().includes(searchCountryCodeQuery.toLowerCase())
  );

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!firstName.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    if (!lastName.trim()) {
      setError('Por favor, ingresa tu apellido');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Por favor, ingresa tu número de teléfono');
      return;
    }

    try {
      setIsLoading(true);
      const { needsEmailVerification } = await signUp(email, password, {
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: `${selectedCountryCode.code}${phoneNumber.trim()}`
      });
      
      if (needsEmailVerification) {
        setIsSuccess(true);
      } else {
        // User is already confirmed, redirect to return path with order data
        navigate(returnTo, { state: orderData });
      }
    } catch (err) {
      console.error('Error during signup:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8 text-center"
              >
                <div className="mb-6 flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-4">¡Revisa tu correo!</h1>
                <p className="text-gray-600 mb-6">
                  Te hemos enviado un correo electrónico a <strong>{email}</strong> con un enlace para verificar tu cuenta.
                </p>
                <p className="text-gray-600 mb-8">
                  Por favor, haz clic en el enlace para activar tu cuenta y comenzar a usar LaCantinaXL.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <h1 className="text-2xl font-bold mb-6 text-center">Crea tu cuenta</h1>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Tu apellido"
                        required
                      />
                    </div>
                  </div>

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
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryCodeList(!showCountryCodeList)}
                          className="h-full px-3 py-2 rounded-lg border border-gray-300 flex items-center gap-2 hover:bg-gray-50"
                        >
                          <span>{selectedCountryCode.code}</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showCountryCodeList && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <div className="px-3 py-2 border-b border-gray-200">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                  type="text"
                                  placeholder="Buscar país..."
                                  value={searchCountryCodeQuery}
                                  onChange={(e) => setSearchCountryCodeQuery(e.target.value)}
                                  className="w-full pl-8 pr-4 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                              </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {filteredCountryCodes.map((country) => (
                                <button
                                  key={`${country.code}-${country.country}`}
                                  type="button"
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                                  onClick={() => {
                                    setSelectedCountryCode(country);
                                    setShowCountryCodeList(false);
                                    setSearchCountryCodeQuery('');
                                  }}
                                >
                                  <span>{country.country}</span>
                                  <span className="text-gray-500">{country.code}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          id="phone"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Número de teléfono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
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
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                        minLength={6}
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
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear cuenta'
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <button 
                    onClick={() => navigate('/login', { state: location.state })} // Pass the same state to preserve order data
                    className="text-red-500 hover:text-red-600 font-medium"
                  >
                    Inicia sesión
                  </button>
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
