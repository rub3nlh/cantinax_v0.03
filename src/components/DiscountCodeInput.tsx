import React, { useState } from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { trackEvent, EventTypes } from '../lib/analytics';

interface DiscountCodeInputProps {
  onApplyCode: (code: string) => Promise<void>; // Function to call when applying
  onRemoveCode: () => void; // Function to call to remove the code
  appliedCode: string | null; // The currently applied code, if any
  isLoading: boolean; // Loading state during validation
  error: string | null; // Error message from validation
  successMessage?: string; // Optional success message
}

export const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  onApplyCode,
  onRemoveCode,
  appliedCode,
  isLoading,
  error,
  successMessage = '¡Código aplicado con éxito!', // Default success message
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleApplyClick = async () => {
    if (!inputValue.trim()) return; // Don't apply if input is empty
    
    const code = inputValue.trim().toUpperCase();
    
    // Tracking de intento de aplicación de código de descuento
    trackEvent(EventTypes.DISCOUNT_CODE_APPLIED, {
      discount_code: code,
      success: false, // Inicialmente false, se actualizará si tiene éxito
      step: 'attempt',
      funnel_step: 'discount_code_input'
    });
    
    try {
      await onApplyCode(code); // Standardize to uppercase
      
      // Si no hay error, el código se aplicó con éxito
      if (!error) {
        trackEvent(EventTypes.DISCOUNT_CODE_APPLIED, {
          discount_code: code,
          success: true,
          step: 'success',
          funnel_step: 'discount_code_input'
        });
      }
    } catch (err) {
      // Error al aplicar el código
      trackEvent(EventTypes.VALIDATION_ERROR, {
        discount_code: code,
        error_message: err instanceof Error ? err.message : 'Error desconocido',
        funnel_step: 'discount_code_input'
      });
    }
  };

  const handleRemoveClick = () => {
    setInputValue(''); // Clear input when removing
    
    // Tracking de eliminación de código de descuento
    if (appliedCode) {
      trackEvent(EventTypes.DISCOUNT_CODE_REMOVED, {
        discount_code: appliedCode,
        funnel_step: 'discount_code_input'
      });
    }
    
    onRemoveCode();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Optionally clear error when user starts typing again
    // if (error) {
    //   onRemoveCode(); // Or have a dedicated clearError function in the hook
    // }
  };

  return (
    <div className="my-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <label htmlFor="discount-code" className="block text-sm font-medium text-gray-700 mb-1">
        ¿Tienes un código de descuento?
      </label>
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          id="discount-code"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Ej: CANTINAXL20"
          className={`flex-grow px-3 py-2 border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm ${
            appliedCode ? 'border-green-500 bg-green-50' : 'border-gray-300'
          } ${error ? 'border-red-500' : ''}`}
          disabled={isLoading || !!appliedCode} // Disable input if loading or code applied
          aria-describedby="discount-feedback" // Link input to feedback messages
        />
        {!appliedCode ? (
          <button
            type="button"
            onClick={handleApplyClick}
            disabled={isLoading || !inputValue.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            ) : null}
            {isLoading ? 'Validando...' : 'Aplicar'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRemoveClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            title="Eliminar código"
          >
            <XCircle className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Feedback Area */}
      <div id="discount-feedback" className="mt-2 text-sm min-h-[20px]">
        {isLoading && (
          <p className="text-gray-600 flex items-center">
            <Loader2 className="animate-spin mr-1 h-4 w-4" aria-hidden="true" />
            Validando código...
          </p>
        )}
        {error && !isLoading && (
          <p className="text-red-600 flex items-center">
            <AlertTriangle className="mr-1 h-4 w-4" aria-hidden="true" />
            {error}
          </p>
        )}
        {appliedCode && !isLoading && !error && (
          <p className="text-green-600 flex items-center">
            <CheckCircle className="mr-1 h-4 w-4" aria-hidden="true" />
            {successMessage} ({appliedCode})
          </p>
        )}
      </div>
    </div>
  );
};
