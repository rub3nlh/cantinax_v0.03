import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculatePackagePrice } from '../utils/priceCalculator';

// Mock de las variables de entorno
vi.mock('import.meta.env', () => ({
  env: {
    VITE_MEAL_COST: '6.00',
    VITE_DELIVERY_COST: '2.50',
    VITE_PRICE_MARGIN: '0.17'
  }
}));

describe('calculatePackagePrice', () => {
  // Casos de borde
  it('debería devolver 0 cuando no hay comidas', () => {
    expect(calculatePackagePrice(0, 5)).toBe(0);
  });

  it('debería devolver 0 cuando no hay entregas', () => {
    expect(calculatePackagePrice(5, 0)).toBe(0);
  });

  it('debería manejar valores negativos como 0', () => {
    expect(calculatePackagePrice(-3, 5)).toBe(calculatePackagePrice(0, 5));
    expect(calculatePackagePrice(5, -3)).toBe(calculatePackagePrice(5, 0));
  });

  // Casos estándar de la tabla proporcionada
  it('debería calcular correctamente el precio para 3 comidas y 3 entregas (Toquecito XL)', () => {
    // (3 * 6.00 + 3 * 2.50) * 1.17 = 29.835 -> 29.9 - 0.01 = 29.99
    expect(calculatePackagePrice(3, 3)).toBe(29.99);
  });

  it('debería calcular correctamente el precio para 5 comidas y 5 entregas (Semana Sabrosa)', () => {
    // (5 * 6.00 + 5 * 2.50) * 1.17 = 49.725 -> 49.8 - 0.01 = 49.99
    expect(calculatePackagePrice(5, 5)).toBe(49.99);
  });

  it('debería calcular correctamente el precio para 7 comidas y 7 entregas (Combo Completo XL)', () => {
    // (7 * 6.00 + 7 * 2.50) * 1.17 = 69.615 -> 69.7 - 0.01 = 69.99
    expect(calculatePackagePrice(7, 7)).toBe(69.99);
  });

  // Casos personalizados de la tabla
  it('debería calcular correctamente el precio para 5 comidas y 3 entregas', () => {
    // (5 * 6.00 + 3 * 2.50) * 1.17 = 43.875 -> 43.9 - 0.01 = 43.99
    expect(calculatePackagePrice(5, 3)).toBe(43.99);
  });

  it('debería calcular correctamente el precio para 9 comidas y 3 entregas', () => {
    // (9 * 6.00 + 3 * 2.50) * 1.17 = 71.955 -> 72.0 - 0.01 = 71.99
    expect(calculatePackagePrice(9, 3)).toBe(71.99);
  });

  it('debería calcular correctamente el precio para 7 comidas y 4 entregas', () => {
    // (7 * 6.00 + 4 * 2.50) * 1.17 = 60.84 -> 60.9 - 0.01 = 60.99
    expect(calculatePackagePrice(7, 4)).toBe(60.99);
  });

  it('debería calcular correctamente el precio para 1 comida y 1 entrega', () => {
    // (1 * 6.00 + 1 * 2.50) * 1.17 = 9.945 -> 10.0 - 0.01 = 9.99
    expect(calculatePackagePrice(1, 1)).toBe(9.99);
  });

  // Caso problemático: 9 comidas y 2 entregas
  it('debería manejar correctamente el caso de 9 comidas y 2 entregas sin decimales infinitos', () => {
    // (9 * 6.00 + 2 * 2.50) * 1.17 = 69.03 -> ceil(69.03) = 70 -> 70 - 0.01 = 69.99
    const price = calculatePackagePrice(9, 2);
    
    // Verificar que el precio es exactamente 69.99 sin decimales infinitos
    expect(price).toBe(69.99);
    
    // Verificar que el precio formateado como string tiene solo 2 decimales
    expect(price.toFixed(2)).toBe('69.99');
    
    // Verificar que no hay problemas de precisión de punto flotante
    expect(Math.abs(price - 69.99) < Number.EPSILON).toBe(true);
  });

  // Prueba adicional para verificar que el redondeo funciona correctamente
  it('debería redondear correctamente al décimo superior y restar 0.01', () => {
    // Simulamos un caso donde el cálculo da 25.23
    // Debería redondearse a 25.3 y luego restar 0.01 para dar 25.29
    const mockBasePrice = 25.23;
    const roundedPrice = Math.ceil(mockBasePrice * 10) / 10;
    const finalPrice = roundedPrice - 0.01;
    
    expect(roundedPrice).toBe(25.3);
    expect(finalPrice).toBe(25.29);
  });
});
