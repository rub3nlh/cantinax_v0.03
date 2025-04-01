import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

// Define a type for the discount details returned from the function
export interface DiscountDetails {
  id: string;
  code: string;
  discount_percentage: number;
  type: string;
}

export function useDiscount() {
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountDetails, setDiscountDetails] = useState<DiscountDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const applyCode = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get current user ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) {
        throw new Error(sessionError?.message || 'User not authenticated');
      }
      const userId = session.user.id;

      // 2. Call the database function
      const { data, error: functionError } = await supabase.rpc('validate_discount_code', {
        p_code: code,
        p_user_id: userId, // Pass the user ID
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      // 2. Process the response
      if (data?.success === true) {
        // Type assertion to ensure data matches DiscountDetails
        const validatedDiscount = data.data as DiscountDetails;
        setDiscountDetails(validatedDiscount);
        setAppliedCode(code.toUpperCase());
        setError(null);
      } else {
        setError(data?.error || 'Error al validar el código de descuento');
        setAppliedCode(null);
        setDiscountDetails(null);
      }
    } catch (err: any) {
      console.error('Error applying discount code:', err);
      setError(err.message || 'Error interno al validar el código');
      setAppliedCode(null);
      setDiscountDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeCode = useCallback(() => {
    setAppliedCode(null);
    setDiscountDetails(null);
    setError(null);
    setIsLoading(false);
  }, []); // No dependencies

  return {
    appliedCode,
    discountDetails,
    isLoading,
    error,
    applyCode,
    removeCode,
  };
}
