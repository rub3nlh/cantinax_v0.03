/**
 * Script para registrar productos en Brevo
 * 
 * Este script registra todos los paquetes disponibles en Brevo para estadísticas de compra.
 * Solo necesita ejecutarse una vez, o cuando se añadan nuevos paquetes.
 */

import { registerProducts } from '../services/brevo_stats.js';

// Definición de paquetes (copiada de src/data/packages.ts)
const packages = [
  {
    id: 'personalizado',
    name: 'Personalizado',
    description: 'Elige tu propio número de comidas y días de entrega',
    meals: 0,
    price: 0
  },
  {
    id: 'toquecito-xl',
    name: 'Toquecito XL',
    meals: 3,
    description: 'Cubre 3 días de alimentación variada.',
    price: 29.99
  },
  {
    id: 'semana-sabrosa',
    name: 'Semana Sabrosa',
    meals: 5,
    description: 'Ideal para una semana de tranquilidad.',
    price: 49.99
  },
  {
    id: 'combo-completo-xl',
    name: 'Combo Completo XL',
    meals: 7,
    description: 'Cobertura completa, sin preocupaciones.',
    price: 69.99
  }
];

async function registerPackagesInBrevo() {
  try {
    console.log('Registering packages in Brevo...');
    
    // Incluir todos los paquetes, incluyendo el personalizado
    const productsToRegister = packages.map(pkg => ({
      ...pkg,
      // Añadir una URL de imagen ficticia para los paquetes
      imageUrl: `https://cantinaxl.com/images/packages/${pkg.id}.jpg`
    }));
    
    console.log(`Found ${productsToRegister.length} packages to register:`, 
      productsToRegister.map(p => p.name).join(', '));
    
    // Registrar los productos en Brevo
    const result = await registerProducts(productsToRegister);
    
    console.log('Packages registered successfully in Brevo!');
    console.log('Result:', result);
    
    return result;
  } catch (error) {
    console.error('Error registering packages in Brevo:', error);
    throw error;
  }
}

// Ejecutar la función si este script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  registerPackagesInBrevo()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { registerPackagesInBrevo };
