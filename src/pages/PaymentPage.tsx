import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, AlertCircle, Lock } from 'lucide-react';
import { OrderSummary, PaymentMethod } from '../types';
import { usePayment } from '../hooks/usePayment';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderSummary = location.state as OrderSummary;
  const [processing, setProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { processPayment, loading: paymentLoading, error: paymentError } = usePayment();

  const handlePayment = async () => {
    if (!user || processing) return;

    try {
      setProcessing(true);
      setError(null);

      let orderId = createdOrderId;
      
      if (!orderId) {
        // Basic validation
        if (!orderSummary || !orderSummary.selectedMeals) {
          throw new Error('No hay comidas seleccionadas');
        }

        // Prepare order data
        const orderPayload = {
          user_id: user.id,
          package_id: orderSummary.package.id,
          package_data: orderSummary.package,
          meals: orderSummary.selectedMeals,
          delivery_address_id: orderSummary.deliveryAddress.id,
          delivery_address_data: {
            recipient_name: orderSummary.deliveryAddress.recipientName || '',
            phone: orderSummary.deliveryAddress.phone || '',
            address: orderSummary.deliveryAddress.address || '',
            province: orderSummary.deliveryAddress.province || '',
            municipality: orderSummary.deliveryAddress.municipality || ''
          },
          personal_note: orderSummary.personalNote || '',
          total: orderSummary.package.price || 0
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
        amount: (orderSummary.package.price || 0) * 100, // Convert to cents
        currency: 'EUR',
        description: `${orderSummary.package.name} - ${orderSummary.selectedMeals.length} comidas`,
        urlSuccess: `${window.location.origin}/thank-you?order=${orderId}`,
        urlFailed: `${window.location.origin}/payment?order=${orderId}`,
        client: clientData
      });

      // If mock payment, the hook will handle the navigation
      if (!result.mock && result.shortUrl) {
        window.location.href = result.shortUrl;
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Ha ocurrido un error al procesar el pago');
      setProcessing(false);
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

            <div className="p-4 rounded-lg border-2 border-red-500 bg-red-50">
              <div className="flex items-center gap-4">
                <Wallet className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-medium">TropiPay</h3>
                  <p className="text-sm text-gray-600">Transferencia instantánea con TropiPay</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg">Total a pagar:</span>
                <span className="text-2xl font-bold">${orderSummary.package.price}</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className={`w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 ${
                  !processing
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Lock className="w-5 h-5" />
                {processing ? (
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