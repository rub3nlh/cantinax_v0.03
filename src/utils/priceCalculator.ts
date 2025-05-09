/**
 * Calcula el precio de un paquete basado en la cantidad de comidas y entregas
 * @param meals Número de comidas
 * @param deliveries Número de entregas
 * @returns Precio calculado
 */
export function calculatePackagePrice(meals: number, deliveries: number): number {
  // Obtener valores de las variables de entorno
  const mealCost = parseFloat(import.meta.env.VITE_MEAL_COST || '6.00');
  const deliveryCost = parseFloat(import.meta.env.VITE_DELIVERY_COST || '2.50');
  const margin = parseFloat(import.meta.env.VITE_PRICE_MARGIN || '0.17');
  
  // Validar que no haya valores negativos
  const safetyMeals = Math.max(0, meals);
  const safetyDeliveries = Math.max(0, deliveries);
  
  // Si no hay comidas o entregas, el precio es 0
  if (safetyMeals === 0 || safetyDeliveries === 0) {
    return 0;
  }
  
  // Aplicar la fórmula: CEILING((cantidad_comidas * coste_comida + cantidad_entregas * coste_entrega) * (1 + margen), 1) - 0.01
  const basePrice = (safetyMeals * mealCost) + (safetyDeliveries * deliveryCost);
  const priceWithMargin = basePrice * (1 + margin);
  
  // Redondear al entero superior y restar 0.01
  const roundedPrice = Math.ceil(priceWithMargin);
  const priceWithDiscount = roundedPrice - 0.01;
  
  // Formatear a 2 decimales para evitar problemas de precisión
  const finalPrice = parseFloat(priceWithDiscount.toFixed(2));
  return finalPrice;
}
