import { Package } from '../types';

export const packages: Package[] = [
  {
    id: 'custom',
    name: 'Paquete personalizado',
    description: 'Elige tu propio número de comidas y días de entrega',
    meals: 0,
    price: 0
  },
  {
    id: 'basic',
    name: 'Paquete Básico',
    meals: 3,
    description: 'Cubre 3 días de alimentación variada.',
    price: 29.99
  },
  {
    id: 'family',
    name: 'Paquete Familiar',
    meals: 5,
    description: 'Ideal para una semana de tranquilidad.',
    price: 49.99
  },
  {
    id: 'premium',
    name: 'Paquete Premium',
    meals: 7,
    description: 'Cobertura completa, sin preocupaciones.',
    price: 69.99
  }
];
