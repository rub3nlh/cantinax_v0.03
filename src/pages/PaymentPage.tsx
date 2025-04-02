import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, AlertCircle, Lock } from 'lucide-react';
import { OrderSummary, PaymentMethod, Package, Meal, DeliveryAddress } from '../types';
import { usePayment } from '../hooks/usePayment';
import { useAuth } from '../hooks/useAuth';
import { useDiscount } from '../hooks/useDiscount';
import { supabase } from '../lib/supabase';
import { DiscountSummary } from '../components/DiscountSummary';
import { DiscountCodeInput } from '../components/DiscountCodeInput';
import { trackEvent, EventTypes } from '../lib/analytics';

interface OrderPayload {
  user_id: string;
  package_id: string;
  package_data: Package;
  meals: Meal[];
  delivery_address_id: string;
  delivery_address_data: DeliveryAddress;
  personal_note: string;
  total: number;
  discount_code_id?: string | null;
}

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    appliedCode,
    discountDetails,
    isLoading: discountLoading,
    error: discountError,
    applyCode,
    removeCode,
  } = useDiscount();
  const orderSummary = location.state as OrderSummary;
  const [processing, setProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { processPayment, loading: paymentLoading, error: paymentError } = usePayment();
  
  // Tracking de vista de página de pago
  useEffect(() => {
    if (orderSummary) {
      trackEvent(EventTypes.CHECKOUT_START, {
        package_id: orderSummary.package?.id,
        package_name: orderSummary.package?.name,
        package_price: orderSummary.package?.price,
        total_meals: orderSummary.selectedMeals?.length,
        funnel_step: 'payment_page',
        has_discount: !!discountDetails,
        discount_code: discountDetails?.code || null,
        discount_percentage: discountDetails?.discount_percentage || 0
      });
    }
  }, [orderSummary, discountDetails]);

  // Calculate discounted total
  const subtotal = orderSummary.package.price || 0;
  const discountAmount = discountDetails ? (subtotal * (discountDetails.discount_percentage / 100)) : 0;
  const total = subtotal - discountAmount;

  const handlePayment = async () => {
    if (!user || processing) return;

    try {
      setProcessing(true);
      setError(null);
      
      // Tracking de inicio de proceso de pago
      trackEvent(EventTypes.PAYMENT_INITIATED, {
        subtotal: subtotal,
        discount_amount: discountAmount,
        total: total,
        has_discount: !!discountDetails,
        discount_code: discountDetails?.code || null,
        package_id: orderSummary.package?.id,
        package_name: orderSummary.package?.name,
        funnel_step: 'payment_initiated'
      });

      let orderId = createdOrderId;

      if (!orderId) {
        // Basic validation
        if (!orderSummary || !orderSummary.selectedMeals) {
          throw new Error('No hay comidas seleccionadas');
        }

        // Prepare order data with explicit type
        const orderPayload: OrderPayload = {
          user_id: user.id,
          package_id: orderSummary.package.id,
          package_data: orderSummary.package,
          meals: orderSummary.selectedMeals,
          delivery_address_id: orderSummary.deliveryAddress.id,
          delivery_address_data: {
            recipientName: orderSummary.deliveryAddress.recipientName,
            phone: orderSummary.deliveryAddress.phone,
            address: orderSummary.deliveryAddress.address,
            province: orderSummary.deliveryAddress.province,
            municipality: orderSummary.deliveryAddress.municipality,
            id: orderSummary.deliveryAddress.id,
          },
          personal_note: orderSummary.personalNote || '',
          total: total, // Use the discounted total
          discount_code_id: discountDetails?.id,
        };

        // Create order in Supabase
        const { data: createdOrder, error: createError } = await supabase
          .from('orders')
          .insert([orderPayload])
          .select()
          .single();

        if (createError) throw new Error(`Error al crear la orden: ${createError.message}`);
        if (!createdOrder) throw new Error('No se pudo crear la orden');

        orderId = createdOrder.id;
        setCreatedOrderId(orderId);
      }

      // Ensure orderId is set before proceeding to payment
      if (!orderId) {
        throw new Error("Order ID is missing after creation attempt.");
      }

      // Get user metadata for additional info
      const { data: { user: userData } } = await supabase.auth.getUser();
      const userMetadata = userData?.user_metadata || {};

      // Prepare client data for TropiPay
      const clientData = {
        name: userMetadata.display_name?.split(' ')[0] || '',
        lastName: userMetadata.display_name?.split(' ').slice(1).join(' ') || '',
        phone: userMetadata.phone || '',
        email: user.email || '',
        address: orderSummary.deliveryAddress.address || '',
        countryId: 1, // Default to Spain
        termsAndConditions: 'true'
      };

      const result = await processPayment('tropipay', {
        orderId,
        reference: orderId,
        concept: `Pedido #${orderId.slice(0, 8)}`,
        amount: total * 100, // Use the discounted total, convert to cents
        currency: 'EUR',
        description: `${orderSummary.package.name} - ${orderSummary.selectedMeals.length} comidas`,
        urlSuccess: `${window.location.origin}/thank-you?order=${orderId}`,
        urlFailed: `${window.location.origin}/payment?order=${orderId}`,
        client: clientData,
        discountCodeId: discountDetails?.id // Pass discount code ID to payment processing
      });

      // If mock payment, the hook will handle the navigation
      if (!result.mock && result.shortUrl) {
        // Tracking de redirección a la pasarela de pago
        trackEvent(EventTypes.PAYMENT_REDIRECT, {
          order_id: orderId,
          payment_method: 'tropipay',
          total: total,
          funnel_step: 'payment_redirect'
        });
        
        window.location.href = result.shortUrl;
      } else if (result.mock) {
        // Tracking de pago simulado (mock)
        trackEvent(EventTypes.PAYMENT_COMPLETED, {
          order_id: orderId,
          payment_method: 'mock',
          total: total,
          has_discount: !!discountDetails,
          discount_code: discountDetails?.code || null,
          funnel_step: 'payment_completed'
        });
      }

      // Discount code usage is now handled by the database trigger
      // 'trigger_create_discount_usage' on the 'orders' table.
      // No client-side action needed here.

    } catch (err: any) {
      console.error('Payment processing error:', err);
      const errorMessage = err.message || 'Ha ocurrido un error al procesar el pago';
      setError(errorMessage);
      setProcessing(false);
      
      // Tracking de error en el pago
      trackEvent(EventTypes.PAYMENT_ERROR, {
        error_message: errorMessage,
        order_id: createdOrderId,
        funnel_step: 'payment_error'
      });
    }
  };

  // If there's no order summary data, redirect to packages
  if (!orderSummary) {
    navigate('/packages');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Método de Pago</h1>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            {(paymentError || error) && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{paymentError || error}</p>
              </div>
            )}

<div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
              <div className="flex items-center gap-4">
                <Wallet className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-medium">TropiPay</h3>
                  <p className="text-sm text-gray-600">Transferencia instantánea con TropiPay</p>
                </div>
              </div>
            </div>

            {/* Discount Code Input */}
            <DiscountCodeInput
              onApplyCode={applyCode}
              onRemoveCode={removeCode}
              appliedCode={appliedCode}
              isLoading={discountLoading}
              error={discountError}
            />

            <div className="mt-8 pt-6 border-t border-gray-200">
              {/* Discount Summary */}
              {discountDetails && (
                <DiscountSummary
                  code={discountDetails.code}
                  discountPercentage={discountDetails.discount_percentage}
                  discountAmount={discountAmount}
                />
              )}

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg">Subtotal:</span>
                <span className="text-2xl font-bold">${subtotal.toFixed(2)}</span>
              </div>

              {discountDetails && (
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg">Descuento:</span>
                  <span className="text-2xl font-bold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg">Total a pagar:</span>
                <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing || discountLoading}
                className={`w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 ${
                  !processing && !discountLoading
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Lock className="w-5 h-5" />
                {processing || discountLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Procesar Pago'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
