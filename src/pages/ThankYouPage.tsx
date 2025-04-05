import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ChevronRight, ShoppingBag, Loader, AlertCircle } from 'lucide-react';
import { OrderSummary, Package } from '../types';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { trackEvent, EventTypes } from '../lib/analytics';
import { supabase } from '../lib/supabase';

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Fecha no disponible';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha no disponible';
  }
}

interface OrderDetails {
  packageData: Package;
  purchaseDate: string;
  total: number;
}

export const ThankYouPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Estado para manejar la carga de datos
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  
  // Obtener datos del estado de ubicación (si existe)
  const stateData = location.state as Partial<OrderSummary & { purchaseDate: Date }> || {};
  const { package: statePackage, purchaseDate: statePurchaseDate } = stateData;
  
  // Obtener parámetros de URL
  const orderId = searchParams.get('order');
  const reference = searchParams.get('reference');
  const paymentState = searchParams.get('state');
  
  // Verificar si el pago fue exitoso (state=5 indica pago exitoso en TropiPay)
  const isPaymentSuccessful = paymentState === '5';
  
  // Cargar detalles de la orden si hay un ID de orden en la URL
  useEffect(() => {
    const fetchOrderDetails = async () => {
      // Si ya tenemos datos del estado, no necesitamos consultar la base de datos
      if (statePackage && statePurchaseDate) {
        setOrderDetails({
          packageData: statePackage,
          purchaseDate: statePurchaseDate.toString(),
          total: statePackage.price
        });
        return;
      }
      
      // Si no hay ID de orden, no podemos consultar la base de datos
      if (!orderId) {
        setError('No se encontró información del pedido');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Consultar la orden en la base de datos
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('package_data, created_at, total')
          .eq('id', orderId)
          .single();
        
        if (fetchError) {
          throw new Error(`Error al obtener los detalles del pedido: ${fetchError.message}`);
        }
        
        if (!data) {
          throw new Error('No se encontró el pedido');
        }
        
        setOrderDetails({
          packageData: data.package_data as Package,
          purchaseDate: data.created_at,
          total: data.total
        });
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los detalles del pedido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, statePackage, statePurchaseDate]);
  
  // Registrar completación de compra
  useEffect(() => {
    if ((orderDetails?.packageData || statePackage) && orderId) {
      // Registrar evento de compra completada
      trackEvent(EventTypes.PURCHASE_COMPLETED, {
        order_id: orderId,
        reference: reference || orderId, // Usar reference si está disponible
        payment_state: paymentState || 'unknown',
        package_id: orderDetails?.packageData?.id || statePackage?.id,
        package_name: orderDetails?.packageData?.name || statePackage?.name,
        package_price: orderDetails?.packageData?.price || statePackage?.price,
        purchase_date: orderDetails?.purchaseDate 
          ? new Date(orderDetails.purchaseDate).toISOString() 
          : statePurchaseDate 
            ? new Date(statePurchaseDate).toISOString()
            : new Date().toISOString(),
        is_logged_in: !!user,
        user_id: user?.id,
        funnel_step: 'purchase_completed',
        conversion: true,
        payment_successful: isPaymentSuccessful
      });
      
      // Registrar evento adicional si el pago fue exitoso
      if (isPaymentSuccessful) {
        trackEvent(EventTypes.PAYMENT_COMPLETED, {
          order_id: orderId,
          reference: reference || orderId,
          payment_method: 'tropipay',
          payment_state: paymentState,
          funnel_step: 'payment_completed'
        });
      }
    }
  }, [orderDetails, statePackage, orderId, reference, paymentState, user, statePurchaseDate, isPaymentSuccessful]);

  // Renderizar estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-xl text-gray-600">Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  // Renderizar estado de error
  if (error && !orderDetails && !statePackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-grow py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-block text-red-500 mb-6"
                >
                  <AlertCircle className="w-20 h-20" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-4">Ha ocurrido un error</h1>
                <p className="text-xl text-gray-600">{error}</p>
                <button
                  onClick={() => navigate('/packages')}
                  className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                >
                  Volver a la página de paquetes
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Obtener datos del paquete y fecha de compra (ya sea del estado o de la consulta a la base de datos)
  const selectedPackage = orderDetails?.packageData || statePackage;
  const purchaseDate = orderDetails?.purchaseDate || statePurchaseDate;
  const total = orderDetails?.total || (selectedPackage?.price || 0);

  // Si no hay paquete seleccionado, mostrar mensaje de error
  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-grow py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-block text-yellow-500 mb-6"
                >
                  <AlertCircle className="w-20 h-20" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-4">Información no disponible</h1>
                <p className="text-xl text-gray-600">No se encontró información del pedido</p>
                <button
                  onClick={() => navigate('/packages')}
                  className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                >
                  Volver a la página de paquetes
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block text-green-500 mb-6"
              >
                <CheckCircle className="w-20 h-20" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-4">¡Gracias por tu compra!</h1>
              <p className="text-xl text-gray-600">
                Tu pedido ha sido confirmado y será preparado con mucho cariño
              </p>
              {reference && (
                <p className="mt-2 text-gray-500">
                  Referencia de pago: {reference}
                </p>
              )}
            </div>

            {selectedPackage && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-6">Detalles del pedido</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800">Fecha de compra</h3>
                      <p className="text-blue-600">{formatDate(purchaseDate)}</p>
                    </div>
                  </div>
                  
                  {isPaymentSuccessful && (
                    <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium text-green-800">Pago confirmado</h3>
                        <p className="text-green-600">Tu pago ha sido procesado correctamente</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <h3 className="font-medium">Paquete seleccionado</h3>
                      <p className="text-gray-600">{selectedPackage?.name}</p>
                      <p className="text-gray-600">{selectedPackage?.meals} comidas</p>
                      <p className="font-medium mt-2">Total: ${total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Seguimiento de tu pedido</h2>
                <p className="text-gray-600 mb-6">
                  Puedes ver el estado de tus entregas y hacer seguimiento de tu pedido en cualquier momento
                </p>
                <button
                  onClick={() => {
                    // Tracking de clic en ver órdenes
                    trackEvent(EventTypes.BUTTON_CLICK, {
                      button: 'view_orders',
                      page: 'thank_you',
                      order_id: orderId,
                      user_id: user?.id
                    });
                    navigate('/my-orders');
                  }}
                  className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Ver mis órdenes
                </button>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">¿Quieres crear una cuenta?</h2>
                <p className="text-gray-600 mb-6">
                  Crea una cuenta para hacer seguimiento de tus pedidos y gestionar tus direcciones de entrega
                </p>
                <button
                  onClick={() => {
                    // Tracking de clic en crear cuenta después de compra
                    trackEvent(EventTypes.BUTTON_CLICK, {
                      button: 'create_account_after_purchase',
                      page: 'thank_you',
                      order_id: orderId,
                      funnel_step: 'account_creation_from_thank_you'
                    });
                    navigate('/signup');
                  }}
                  className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  Crear cuenta
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
