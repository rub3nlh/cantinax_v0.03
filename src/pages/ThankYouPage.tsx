import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ChevronRight, ShoppingBag, Loader, AlertCircle, Clock } from 'lucide-react';
import { OrderSummary, Package } from '../types';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { usePaymentOrders } from '../hooks/usePaymentOrders';
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
  const { getOrderPayments, updatePaymentOrder } = usePaymentOrders();
  
  // Estado para manejar la carga de datos
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  
  // Estados para el polling de verificación de pago
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | 'timeout'>('pending');
  const [pollingCount, setPollingCount] = useState(0);
  const MAX_POLLING_ATTEMPTS = 60; // Aproximadamente 3 minutos (cada 3 segundos)
  const POLLING_INTERVAL = 3000; // 3 segundos
  
  // Obtener datos del estado de ubicación (si existe)
  const stateData = location.state as Partial<OrderSummary & { purchaseDate: Date }> || {};
  const { package: statePackage, purchaseDate: statePurchaseDate } = stateData;
  
  // Obtener parámetros de URL
  const orderId = searchParams.get('order');
  const reference = searchParams.get('reference');
  const paymentState = searchParams.get('state');
  
  // Ya no usamos directamente el estado de la URL para determinar si el pago fue exitoso
  // En su lugar, esperaremos la confirmación del webhook
  
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
  
  // Verificar si estamos en modo de pago simulado
  const isMockPayment = import.meta.env.VITE_MOCK_PAYMENT === 'true';
  
  // Implementación del polling para verificar el estado del pago
  useEffect(() => {
    // Solo iniciar polling si tenemos un orderId y estamos en estado pendiente
    if (orderId && paymentStatus === 'pending' && pollingCount < MAX_POLLING_ATTEMPTS) {
      const checkPaymentStatus = async () => {
        try {
          console.log(`Verificando estado de pago (intento ${pollingCount + 1}/${MAX_POLLING_ATTEMPTS})...`);
          console.log(`Modo de pago simulado: ${isMockPayment ? 'SÍ' : 'NO'}`);
          
          // Obtener las órdenes de pago asociadas a este pedido
          const paymentOrders = await getOrderPayments(orderId);
          
          console.log('Órdenes de pago encontradas:', paymentOrders);
          
          // Verificar si alguna está completada o fallida
          const completedPayment = paymentOrders.find(p => p.status === 'completed');
          const failedPayment = paymentOrders.find(p => p.status === 'failed');
          
          // En modo de pago simulado, necesitamos esperar a que el webhook actualice el estado
          // aunque el pago ya esté marcado como completado en la base de datos
          if (completedPayment) {
            // Verificar si el pago fue completado por el webhook o por el mock payment
            const wasCompletedByWebhook = completedPayment.reference && 
                                         !completedPayment.reference.startsWith('mock_');
            
            if (wasCompletedByWebhook || !isMockPayment) {
              console.log('Pago verificado como completado por webhook');
              setPaymentStatus('completed');
            } else {
              console.log('Pago completado por mock, esperando confirmación del webhook...');
              // Seguimos en estado pendiente hasta que el webhook actualice el estado
              setPollingCount(prev => prev + 1);
            }
          } else if (failedPayment) {
            console.log('Pago verificado como fallido por webhook');
            setPaymentStatus('failed');
          } else {
            // Incrementar contador y programar siguiente intento
            setPollingCount(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // Incrementar contador incluso en caso de error
          setPollingCount(prev => prev + 1);
        }
      };

      // Ejecutar la primera verificación inmediatamente
      checkPaymentStatus();
      
      // Programar verificaciones periódicas
      const intervalId = setInterval(checkPaymentStatus, POLLING_INTERVAL);
      
      // Limpiar intervalo al desmontar
      return () => clearInterval(intervalId);
    }
  }, [orderId, paymentStatus, pollingCount, getOrderPayments]);

  // Efecto para manejar el timeout del polling
  useEffect(() => {
    if (pollingCount >= MAX_POLLING_ATTEMPTS && paymentStatus === 'pending') {
      // Se agotaron los intentos sin verificación
      console.log('Timeout en la verificación del pago');
      setPaymentStatus('timeout');
      setError('No se pudo verificar el estado del pago. Por favor, contacta con soporte.');
    }
  }, [pollingCount, paymentStatus]);

  // Registrar completación de compra
  useEffect(() => {
    if ((orderDetails?.packageData || statePackage) && orderId && (paymentStatus === 'completed' || paymentStatus === 'failed')) {
      const isPaymentSuccessful = paymentStatus === 'completed';
      
      // Registrar evento de compra completada
      trackEvent(EventTypes.PURCHASE_COMPLETED, {
        order_id: orderId,
        reference: reference || orderId, // Usar reference si está disponible
        payment_state: isPaymentSuccessful ? '5' : '0', // Mantener compatibilidad con el formato anterior
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
          payment_state: '5', // Mantener compatibilidad con el formato anterior
          funnel_step: 'payment_completed'
        });
      }
    }
  }, [orderDetails, statePackage, orderId, reference, user, statePurchaseDate, paymentStatus]);

  // Ya no actualizamos el estado del pago basado en los parámetros de URL
  // Ahora esperamos a que el webhook actualice el estado y lo verificamos mediante polling

  // Renderizar estado de carga inicial
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

  // Renderizar estado de espera de verificación de pago
  if (!loading && !error && orderId && paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-grow py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-block text-blue-500 mb-6"
                >
                  <Clock className="w-20 h-20" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-4">Verificando tu pago</h1>
                <p className="text-xl text-gray-600 mb-4">
                  Estamos procesando tu pago. Por favor, espera un momento...
                </p>
                <div className="flex justify-center">
                  <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <p className="mt-6 text-sm text-gray-500">
                  Esto puede tardar unos segundos. No cierres esta ventana.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Renderizar estado de error
  if ((error && !orderDetails && !statePackage) || paymentStatus === 'timeout' || paymentStatus === 'failed') {
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
                <p className="text-xl text-gray-600">
                  {paymentStatus === 'failed' 
                    ? 'El pago no ha podido ser procesado. Por favor, intenta nuevamente.' 
                    : paymentStatus === 'timeout'
                      ? 'No pudimos confirmar el estado de tu pago. Por favor, contacta con soporte.'
                      : error}
                </p>
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

  // Solo mostrar la página de éxito si el pago ha sido verificado como completado
  if (paymentStatus === 'completed') {
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
                    
                    {paymentStatus === 'completed' && (
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
  }

  // Si llegamos aquí, no hay ningún caso que manejar, devolver null
  return null;
};
