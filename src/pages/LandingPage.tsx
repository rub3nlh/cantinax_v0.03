import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Heart, Leaf, Truck, Clock, ShieldCheck, Instagram, MessageCircle, ChevronRight, ChevronDown, Info } from 'lucide-react';
import { Label } from '../components/ui/Label';
import { packages } from '../data/packages';
import { MealDetails } from '../components/MealDetails';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { DiscountTag } from '../components/ui/DiscountTag';
import { Meal } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeals } from '../hooks/useMeals';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAllMeals, setShowAllMeals] = useState(false);
  const [selectedMealDetails, setSelectedMealDetails] = useState<Meal | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const { meals, loading, error } = useMeals();

  const handlePackageSelection = () => {
    navigate('/packages');
  };

  const handleSelectPackage = (packageId: string) => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      navigate('/meal-selection', { state: { package: selectedPackage } });
    }
  };

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayedMeals = showAllMeals ? meals : meals.slice(0, 4);

  return (
    <div className="font-sans">
      <section className="relative min-h-screen bg-[#FDF6F0]">
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)]">
            <div className="text-left space-y-8">
              <DiscountTag variant="yellow" className="mb-4">
                ¡15% de descuento en tu primer pedido!
              </DiscountTag>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Garantiza comida casera y saludable para tu familia en Cuba
              </h1>
              <p className="text-xl text-gray-600">
                Tú eliges el menú, nosotros nos encargamos del resto. Así es el sabor de estar cerca.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handlePackageSelection}
                  className="bg-red-500 hover:bg-red-600 text-white text-lg px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg"
                >
                  Elige tu paquete ahora
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={scrollToMenu}
                  className="border-2 border-gray-200 hover:border-gray-300 text-gray-700 text-lg px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  Ver menú semanal
                </button>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">48h</div>
                  <div className="text-sm text-gray-600">Primera entrega</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">100%</div>
                  <div className="text-sm text-gray-600">Fresco y casero</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">4.9★</div>
                  <div className="text-sm text-gray-600">Calificación</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-x-0 top-[-2rem] bottom-0 bg-gradient-to-b from-[#FDF6F0] to-transparent lg:hidden z-10" />
              <div className="grid grid-cols-2 gap-4 transform translate-y-[-2rem]">
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <img
                      src="https://img-thumb.mailinblue.com/6765316/images/content_library/original/682254ab26f8e2d685a486c9.jpeg"
                      alt="Lonjas de cerdo"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold">Lonjas de cerdo</h3>
                      <p className="text-sm text-gray-600">Lunes</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <img
                      src="https://img-thumb.mailinblue.com/6765316/images/content_library/original/682254ab999ec966cf66c861.jpeg"
                      alt="Fricasé de cerdo"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold">Fricasé de cerdo</h3>
                      <p className="text-sm text-gray-600">Martes</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 transform translate-y-16">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <img
                      src="https://img-thumb.mailinblue.com/6765316/images/content_library/original/682254ab236acdd0e4d9c9ed.jpeg"
                      alt="Arroz frito"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold">Arroz frito</h3>
                      <p className="text-sm text-gray-600">Miércoles</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <img
                      src="https://img-thumb.mailinblue.com/6765316/images/content_library/original/682254abc099a2fac8f2077b.jpeg"
                      alt="Lonjas ahumadas"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold">Lonjas ahumadas</h3>
                      <p className="text-sm text-gray-600">Jueves</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="mb-4 flex justify-center">
                <ChefHat className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comidas diarias variadas</h3>
              <p className="text-gray-600">Menús tradicionales cubanos preparados por expertos</p>
            </div>
            <div className="text-center p-6">
              <div className="mb-4 flex justify-center">
                <Heart className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chefs expertos</h3>
              <p className="text-gray-600">Cocineros con años de experiencia en comida cubana</p>
            </div>
            <div className="text-center p-6">
              <div className="mb-4 flex justify-center">
                <Leaf className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ingredientes frescos</h3>
              <p className="text-gray-600">Seleccionamos los mejores ingredientes locales</p>
            </div>
            <div className="text-center p-6">
              <div className="mb-4 flex justify-center">
                <Truck className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Entregas diarias</h3>
              <p className="text-gray-600">Puntualidad garantizada en cada entrega</p>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-red-500">¿CÓMO FUNCIONA?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Selecciona el paquete</h3>
              <p className="text-gray-600">Elige entre nuestros planes de 3, 5 o 7 días</p>
            </div>
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Personaliza el menú</h3>
              <p className="text-gray-600">Adapta las comidas a los gustos de tu familia</p>
            </div>
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Recibe tu pedido</h3>
              <p className="text-gray-600">48 horas después ¡Comienza a disfrutar!</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-lg text-red-500 font-medium">
              Todas las entregas incluidas en el precio
            </p>
          </div>
        </div>
      </section>

      <section id="paquetes" className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center ">
          <h2 className="text-4xl font-bold text-center mb-4 text-red-500">NUESTROS PAQUETES</h2>
          <DiscountTag variant="yellow" className="text-center text-xl mb-16 mx-auto">
            ¡Primer pedido con 15% OFF usando CANTINAXL15!
          </DiscountTag>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-lg bg-white border border-gray-200">
              <h3 className="text-2xl font-bold mb-2">3 días</h3>
              <p className="text-4xl font-bold mb-4">$29.99</p>
              <p className="mb-4">3 comidas</p>
              <button 
                onClick={() => handleSelectPackage('basic')}
                className="w-full py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Seleccionar
              </button>
            </div>
            <div className="p-8 rounded-lg bg-red-500 text-white">
              <h3 className="text-2xl font-bold mb-2">5 días</h3>
              <p className="text-4xl font-bold mb-4">$49.99</p>
              <p className="mb-4">5 comidas</p>
              <button 
                onClick={() => handleSelectPackage('family')}
                className="w-full py-2 rounded bg-white text-red-500 hover:bg-red-50 transition-colors"
              >
                Seleccionar
              </button>
              <Label className="mt-2 text-sm w-full text-center">Más popular</Label>
            </div>
            <div className="p-8 rounded-lg bg-white border border-gray-200">
              <h3 className="text-2xl font-bold mb-2">7 días</h3>
              <p className="text-4xl font-bold mb-4">$69.99</p>
              <p className="mb-4">7 comidas</p>
              <button 
                onClick={() => handleSelectPackage('premium')}
                className="w-full py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" ref={menuRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-red-500">MIRA NUESTRO MENÚ</h2>
          
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {displayedMeals.map((meal) => (
                  <div key={meal.id} className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-transform hover:scale-105">
                    <div className="relative">
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-full h-48 object-cover"
                      />
                      {meal.allergens.length > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                          Alérgenos
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{meal.name}</h3>
                      <p className="text-gray-600 mb-4">{meal.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {meal.ingredients.slice(0, 3).map((ingredient, index) => (
                          <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                            {ingredient}
                          </span>
                        ))}
                        {meal.ingredients.length > 3 && (
                          <span className="text-gray-500 text-sm">+{meal.ingredients.length - 3} más</span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedMealDetails(meal)}
                        className="inline-flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {meals.length > 4 && (
                <div className="text-center mt-12">
                  <button
                    onClick={() => setShowAllMeals(!showAllMeals)}
                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-colors"
                  >
                    {showAllMeals ? 'Mostrar menos' : 'Mostrar más'}
                    <ChevronDown className={`w-5 h-5 transition-transform ${showAllMeals ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="mb-4 flex justify-center">
                <img 
                  src="https://spauqltlvfrjmfrghpgk.supabase.co/storage/v1/object/public/site-media//5-aroma%20xl.png" 
                  alt="100% Fresco" 
                  className="h-32 w-auto"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-500">100% Fresco</h3>
              <p className="text-gray-600">Ingredientes frescos y de primera calidad</p>
            </div>
            <div className="text-center p-6">
              <div className="mb-4 flex justify-center">
                <img 
                  src="https://spauqltlvfrjmfrghpgk.supabase.co/storage/v1/object/public/site-media//6-ovni%20xl.png" 
                  alt="Entregas puntuales" 
                  className="h-32 w-auto"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-500">Entregas puntuales</h3>
              <p className="text-gray-600">Garantizamos la entrega en el horario acordado</p>
            </div>
            <div className="text-center p-6">
              <div className="mb-4 flex justify-center">
                <img 
                  src="https://spauqltlvfrjmfrghpgk.supabase.co/storage/v1/object/public/site-media//4-chef%20xl.png" 
                  alt="Seguridad alimentaria" 
                  className="h-32 w-auto"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-500">Seguridad alimentaria</h3>
              <p className="text-gray-600">Máximos estándares de higiene y seguridad</p>
            </div>
          </div>
        </div>
      </section>

      <section id="faqs">
        <FAQ />
      </section>

      <Footer />

      <AnimatePresence>
        {selectedMealDetails && (
          <MealDetails
            meal={selectedMealDetails}
            onClose={() => setSelectedMealDetails(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
