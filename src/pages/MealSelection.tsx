import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stepper } from '../components/Stepper';
import { MealCard } from '../components/MealCard';
import { MealDetails } from '../components/MealDetails';
import { Footer } from '../components/Footer';
import { Package, Meal } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeals } from '../hooks/useMeals';

export const MealSelection: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { package: selectedPackage } = location.state as { package: Package };
  const { meals, loading, error } = useMeals();

  const [mealCounts, setMealCounts] = useState<Record<string, number>>({});
  const [selectedMealDetails, setSelectedMealDetails] = useState<Meal | null>(null);

  const totalMealsSelected = useMemo(() => {
    return Object.values(mealCounts).reduce((sum, count) => sum + count, 0);
  }, [mealCounts]);

  const handleIncrement = (meal: Meal) => {
    if (totalMealsSelected < selectedPackage.meals) {
      setMealCounts((prevCounts) => ({
        ...prevCounts,
        [meal.id]: (prevCounts[meal.id] || 0) + 1,
      }));
    }
  };

  const handleDecrement = (meal: Meal) => {
    setMealCounts((prevCounts) => {
      const newCount = Math.max((prevCounts[meal.id] || 0) - 1, 0);
      if (newCount === 0) {
        const { [meal.id]: _, ...rest } = prevCounts;
        return rest;
      }
      return {
        ...prevCounts,
        [meal.id]: newCount,
      };
    });
  };

  const handleNext = () => {
    if (totalMealsSelected === selectedPackage.meals) {
      const selectedMeals: { meal: Meal; count: number }[] = [];
      for (const mealId in mealCounts) {
        const meal = meals.find((m) => m.id === mealId);
        if (meal) {
          selectedMeals.push({ meal, count: mealCounts[mealId] });
        }
      }

      navigate('/order-summary', {
        state: { package: selectedPackage, selectedMeals },
      });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pb-20">
        <Stepper
          steps={['Selección', 'Personalización', 'Resumen']}
          currentStep={1}
        />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">
              Elige las comidas favoritas de tu familia
            </h1>
            <p className="text-xl text-gray-600">
              Selecciona {selectedPackage.meals} platos para tu paquete
            </p>
            <div className="mt-4 text-lg font-medium text-red-500">
              {totalMealsSelected}/{selectedPackage.meals} seleccionados
            </div>
          </motion.div>

          {Object.keys(mealCounts).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Comidas seleccionadas:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(mealCounts).map(([mealId, count]) => {
                  const meal = meals.find((m) => m.id === mealId);
                  if (!meal) return null;

                  return (
                    <div
                      key={`${meal.id}`}
                      className="flex items-center gap-3 bg-white p-3 rounded-lg shadow"
                    >
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{meal.name}</h4>
                        <p className="text-sm text-gray-500">Cantidad: {count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                count={mealCounts[meal.id] || 0}
                onIncrement={() => handleIncrement(meal)}
                onDecrement={() => handleDecrement(meal)}
                disabled={totalMealsSelected >= selectedPackage.meals && !(mealCounts[meal.id] > 0)}
                onShowDetails={() => setSelectedMealDetails(meal)}
              />
            ))}
          </div>

          <div className="flex justify-between mb-12">
            <button
              onClick={handleBack}
              className="px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-gray-300"
            >
              ← Atrás
            </button>
            <button
              onClick={handleNext}
              disabled={totalMealsSelected !== selectedPackage.meals}
              className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                totalMealsSelected === selectedPackage.meals
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedMealDetails && (
          <MealDetails
            meal={selectedMealDetails}
            onClose={() => setSelectedMealDetails(null)}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};
