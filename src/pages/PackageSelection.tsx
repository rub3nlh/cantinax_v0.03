import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper } from '../components/Stepper';
import { PackageCard } from '../components/PackageCard';
import { Footer } from '../components/Footer';
import { packages } from '../data/packages';
import { Package } from '../types';
import { motion } from 'framer-motion';
import { trackEvent, EventTypes } from '../lib/analytics';
import { calculatePackagePrice } from '../utils/priceCalculator';

export const PackageSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [customMeals, setCustomMeals] = useState<number>(0);
  const [customDays, setCustomDays] = useState<number>(0);
  
  // Registrar visualización de la página de paquetes
  useEffect(() => {
    trackEvent(EventTypes.PACKAGE_VIEW, {
      page: 'package_selection'
    });
  }, []);

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    
    // Registrar selección de paquete
    trackEvent(EventTypes.PACKAGE_SELECT, {
      package_id: pkg.id,
      package_name: pkg.name,
      package_price: pkg.price,
      is_custom: pkg.id === 'custom'
    });
    
    if (pkg.id !== 'custom') {
      setCustomMeals(0);
      setCustomDays(0);
    } else {
      // Initialize with sensible defaults when custom package is selected
      setCustomMeals(1);
      setCustomDays(1);
    }
  };
  
  // Create a computed package object for the custom package
  const computedCustomPackage = useMemo(() => {
    if (selectedPackage?.id !== 'custom' || customMeals <= 0 || customDays <= 0) {
      return packages.find(p => p.id === 'custom');
    }
    
    // Aplicar la fórmula de cálculo de precio
    const price = calculatePackagePrice(customMeals, customDays);
    
    return {
      ...selectedPackage,
      meals: customMeals,
      price,
      description: `${customMeals} comidas en ${customDays} días`
    };
  }, [selectedPackage, customMeals, customDays]);

  const handleNext = () => {
    if (!selectedPackage) return;

    let packageToSend = selectedPackage;
    
    if (selectedPackage.id === 'custom') {
      if (customMeals <= 0 || customDays <= 0) return;
      
      // Aplicar la fórmula de cálculo de precio
      const price = calculatePackagePrice(customMeals, customDays);
      
      packageToSend = {
        ...selectedPackage,
        meals: customMeals,
        price,
        description: `${customMeals} comidas en ${customDays} días`
      };
    }

    // Registrar finalización de la selección de paquete y avance al siguiente paso
    trackEvent(EventTypes.BUTTON_CLICK, {
      button: 'continue_to_meal_selection',
      package_id: packageToSend.id,
      package_name: packageToSend.name,
      package_price: packageToSend.price,
      package_meals: packageToSend.meals,
      is_custom: packageToSend.id === 'custom',
      funnel_step: 'package_selection',
      next_step: 'meal_selection'
    });

    navigate('/meal-selection', { state: { package: packageToSend } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pb-20">
        <Stepper
          steps={['Selección', 'Personalización', 'Resumen']}
          currentStep={0}
        />
        
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">
              ¿Cuántas comidas quieres regalar?
            </h1>
            <p className="text-xl text-gray-600">
              Elige el paquete que mejor se adapte a las necesidades de tu familia
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[...packages.filter(p => p.id !== 'custom'), computedCustomPackage].filter((pkg): pkg is Package => pkg !== undefined).map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg.id === 'custom' && computedCustomPackage ? computedCustomPackage : pkg}
                selected={selectedPackage?.id === pkg.id}
                onSelect={handlePackageSelect}
                onNextStep={handleNext}
                customControls={selectedPackage?.id === 'custom' && pkg.id === 'custom' ? (
                  <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Comidas</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomMeals(Math.max(1, customMeals - 1));
                          }}
                          className="w-8 h-8 rounded-full bg-white text-red-500 border border-red-500 flex items-center justify-center hover:bg-red-50"
                        >
                          -
                        </button>
                        <span>{customMeals}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomMeals(customMeals + 1);
                          }}
                          className="w-8 h-8 rounded-full bg-white text-red-500 border border-red-500 flex items-center justify-center hover:bg-red-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Días</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomDays(Math.max(1, customDays - 1));
                          }}
                          className="w-8 h-8 rounded-full bg-white text-red-500 border border-red-500 flex items-center justify-center hover:bg-red-50"
                        >
                          -
                        </button>
                        <span>{customDays}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomDays(customDays + 1);
                          }}
                          className="w-8 h-8 rounded-full bg-white text-red-500 border border-red-500 flex items-center justify-center hover:bg-red-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={!selectedPackage || (selectedPackage.id === 'custom' && (customMeals <= 0 || customDays <= 0))}
              className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                selectedPackage
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
