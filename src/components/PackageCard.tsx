import React from 'react';
import { Package } from '../types';
import { motion } from 'framer-motion';

interface PackageCardProps {
  package: Package;
  selected: boolean;
  onSelect: (pkg: Package) => void;
  onNextStep?: () => void; // Nueva prop para manejar la navegación
  customControls?: React.ReactNode;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  selected,
  onSelect,
  onNextStep,
  customControls,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`cursor-pointer p-6 rounded-xl transition-all ${
        selected
          ? 'bg-red-500 text-white shadow-lg'
          : 'bg-white border-2 border-gray-200 hover:border-red-500'
      }`}
      onClick={() => onSelect(pkg)}
    >
      <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
      <p className="text-3xl font-bold mb-4">
        {pkg.id === 'custom' 
          ? (pkg.price > 0 ? `$${pkg.price}` : 'Personalizado') 
          : `$${pkg.price}`}
      </p>
      <div className="mb-4">
        <span className="text-lg">
          {pkg.id === 'custom' 
            ? (pkg.meals > 0 ? `${pkg.meals} comidas` : 'Elige cantidad')
            : `${pkg.meals} comidas`}
        </span>
      </div>
      <p className={`text-sm ${selected ? 'text-red-100' : 'text-gray-600'}`}>
        {pkg.description}
      </p>
      <button
        className={`mt-4 w-full py-2 px-4 rounded-lg transition-colors ${
          selected
            ? 'bg-white text-red-500 hover:bg-red-50'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
        onClick={(e) => {
          e.stopPropagation(); // Evitar que se propague al div padre
          if (selected && onNextStep) {
            onNextStep();
          } else {
            onSelect(pkg);
          }
        }}
      >
        {selected ? 'Siguiente' : 'Seleccionar'}
      </button>
      {customControls}
    </motion.div>
  );
};
