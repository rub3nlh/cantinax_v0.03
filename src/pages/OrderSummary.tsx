import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stepper } from '../components/Stepper';
import { Footer } from '../components/Footer';
import { Package, Meal, DeliveryAddress } from '../types';
import { calculateDeliveryDates, DeliveryPreview } from '../utils/deliveryCalculator';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { AddressModal } from '../components/AddressModal';
import { useAddresses } from '../hooks/useAddresses';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useGeoLocation } from '../hooks/useGeoLocation';

// Country list for the country selector
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

export const OrderSummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { country_code, loading: geoLoading } = useGeoLocation();
  const { package: selectedPackage, selectedMeals } = location.state as {
    package: Package;
    selectedMeals: { meal: Meal; count: number }[];
  };

  const [personalNote, setPersonalNote] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const { addresses, addAddress, removeAddress, userInfo, saveUserInfo } = useAddresses();
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  
  // State for address and country fields
  const [userAddress, setUserAddress] = useState('');
  const [userCountry, setUserCountry] = useState('');

  // Form state for user info (only used when not logged in)
  const [name, setName] = useState(userInfo?.name || '');
  const [email, setEmail] = useState(userInfo?.email || '');

  // Check if user needs to provide address and country
  const needsAddressAndCountry = !!user && (!user.user_metadata || !user.user_metadata.address);

  // Set country based on IP geolocation
  useEffect(() => {
    if (!geoLoading && country_code && needsAddressAndCountry) {
      // Find matching country in our list
      const matchingCountry = COUNTRIES_ISO.find(c => c.code === country_code);
      if (matchingCountry) {
        setUserCountry(matchingCountry.code);
        console.log(`🌍 Preselected country: ${matchingCountry.name}`);
      }
    }
  }, [country_code, geoLoading, needsAddressAndCountry]);

  // Automatically select the address if there's only one
  useEffect(() => {
    if (addresses.length === 1 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, selectedAddress]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCheckout = async () => {
    // Check if we have a selected address
    if (!selectedAddress) return;

    // Check if address and country are required and provided
    if (needsAddressAndCountry && (!userAddress || !userCountry)) {
      return; // Don't proceed if address/country are required but not provided
    }

    // Save address and country to user profile immediately when "Pagar ahora" is clicked
    // This ensures the data is saved even if payment fails or has an error
    if (needsAddressAndCountry && userAddress && userCountry && user) {
      try {
        console.log('💾 Saving address and country to user profile...');
        await updateProfile(user, {
          name: user.user_metadata?.display_name || '',
          phone: user.user_metadata?.phone || '',
          address: userAddress,
          countryIso: userCountry
        });
        console.log('✅ Address and country saved successfully');
      } catch (error) {
        console.error('Error updating profile:', error);
        // Continue with checkout even if profile update fails
      }
    }

    // HACK: Reordenar las comidas si la primera tiene cantidad > 1
    let optimizedMeals = [...selectedMeals];
    if (selectedMeals.length > 1 && selectedMeals[0].count > 1) {
      console.log('⚠️ Primera comida con cantidad > 1, reordenando para evitar error...');
      // Buscar una comida con cantidad = 1 para ponerla al principio
      const indexWithCountOne = selectedMeals.findIndex(item => item.count === 1);
      
      if (indexWithCountOne > 0) {
        // Intercambiar la primera comida con la que tiene cantidad = 1
        const temp = optimizedMeals[0];
        optimizedMeals[0] = optimizedMeals[indexWithCountOne];
        optimizedMeals[indexWithCountOne] = temp;
        console.log('🔄 Comidas reordenadas para evitar error en el pedido');
      } else {
        // Si todas tienen cantidad > 1, simplemente reordenarlas para evitar el problema
        const temp = optimizedMeals[0];
        optimizedMeals[0] = optimizedMeals[optimizedMeals.length - 1];
        optimizedMeals[optimizedMeals.length - 1] = temp;
        console.log('🔄 Comidas reordenadas para evitar error en el pedido');
      }
    }

    // Save user info if not logged in
    if (!user) {
      saveUserInfo({ name, email });
      
      // Common order data to pass to login/signup
      const orderStateData = {
        returnTo: '/payment',
        orderData: {
          package: selectedPackage,
          selectedMeals: optimizedMeals,  // Usar las comidas optimizadas
          personalNote,
          deliveryAddress: selectedAddress
        }
      };
      
      // Show login/signup modal or navigate directly to login
      // For simplicity, we'll navigate directly to login
      // The user can then click on the signup link if they need to create an account
      navigate('/login', { state: orderStateData });
      return;
    }

    // If logged in, proceed directly to payment
    navigate('/payment', {
      state: {
        package: selectedPackage,
        selectedMeals: optimizedMeals,  // Usar las comidas optimizadas
        personalNote,
        deliveryAddress: selectedAddress
      }
    });
  };

  // Calculate delivery dates
  const deliveryPreviews = useMemo(() => {
    if (selectedPackage && selectedMeals) {
      return calculateDeliveryDates(selectedPackage, selectedMeals);
    }
    return [];
  }, [selectedPackage, selectedMeals]);

  const handleAddAddress = (address: DeliveryAddress) => {
    addAddress(address);
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pb-20">
        <Stepper
          steps={['Selección', 'Personalización', 'Resumen']}
          currentStep={2}
        />
        
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">
              {user ? `¡Hola ${user.user_metadata?.display_name || user.email}!` : 'Revisa tu pedido'}
            </h1>
            <p className="text-xl text-gray-600">
              {user 
                ? 'Vamos a revisar la orden'
                : 'Confirma los detalles de tu pedido antes de continuar'
              }
            </p>
          </motion.div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Resumen del pedido</h2>

            <div className="mb-8">
              <h3 className="font-semibold mb-4">Paquete seleccionado:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-medium">{selectedPackage.name}</p>
                <p className="text-gray-600">{selectedPackage.description}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-4">Comidas seleccionadas:</h3>
              <div className="space-y-4">
                {selectedMeals.map(({ meal, count }) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg"
                  >
                    <img
                      src={meal.image}
                      alt={meal.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-sm text-gray-600">Cantidad: {count}</p>
                      <p className="text-sm text-gray-600">{meal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-4">Fechas de entrega previstas:</h3>
              <div className="space-y-4">
                {deliveryPreviews.map((delivery, index) => {
                  const formattedDate = new Intl.DateTimeFormat('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  }).format(delivery.scheduledDate);
                  
                  const deliveryTimeWindow = "(entre las 11am y las 7pm)";
                  
                  return (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium capitalize">
                          {formattedDate} <span className="text-sm font-normal">{deliveryTimeWindow}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          {delivery.meals.length} {delivery.meals.length === 1 ? 'comida' : 'comidas'}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {delivery.meals.map((meal, mealIndex) => (
                          <span key={meal.id}>
                            {meal.name}
                            {mealIndex < delivery.meals.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-4">Dirección de entrega:</h3>
              {addresses.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-4">Aún no has agregado ninguna dirección de entrega</p>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar dirección
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedAddress(address)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedAddress?.id === address.id
                          ? 'border-blue-500 bg-blue-50' // Changed from red to blue
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{address.recipientName}</h4>
                          <p className="text-gray-600">{address.phone}</p>
                          <p className="text-gray-600">{address.address}</p>
                          <p className="text-gray-600">
                            {address.municipality}, {address.province}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAddress(address.id);
                            if (selectedAddress?.id === address.id) {
                              setSelectedAddress(null);
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar otra dirección
                  </button>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-4">Nota personal:</h3>
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="Personaliza tu pedido: Comparte alergias, intolerancias o preferencias especiales"
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 focus:ring-opacity-50"
              />
            </div>

            {needsAddressAndCountry && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4 text-gray-700">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-medium">
                    Datos tuyos que necesitamos para poder completar el pago
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      País
                    </label>
                    <select
                      id="country"
                      value={userCountry}
                      onChange={(e) => setUserCountry(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecciona un país</option>
                      {COUNTRIES_ISO.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t-2 border-gray-100 pt-6">
              <div className="flex justify-between items-center text-xl font-bold mb-6">
                <span>Total:</span>
                <span>${selectedPackage.price}</span>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-gray-300"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={
                    !selectedAddress || 
                    (needsAddressAndCountry && (!userAddress || !userCountry))
                  }
                  className={`px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 ${
                    selectedAddress && 
                    !(needsAddressAndCountry && (!userAddress || !userCountry))
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  Pagar ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddressModal && (
          <AddressModal
            onClose={() => setShowAddressModal(false)}
            onSave={handleAddAddress}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};
