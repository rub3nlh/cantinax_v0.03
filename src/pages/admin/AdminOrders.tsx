import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle, XCircle, Package, Calendar, Truck, Ban } from 'lucide-react';
import { useOrders, OrderFilters } from '../../hooks/useOrders';

const ITEMS_PER_PAGE = 10;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  delivered: 'bg-purple-100 text-purple-800 border-purple-200',
  failed: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_ICONS = {
  pending: Clock,
  processing: Package,
  completed: CheckCircle,
  cancelled: XCircle,
  in_progress: Truck,
  ready: CheckCircle,
  delivered: CheckCircle,
  failed: XCircle
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  processing: 'En proceso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  in_progress: 'En preparación',
  ready: 'Lista para entrega',
  delivered: 'Entregada',
  failed: 'Fallida'
};

export const AdminOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(null);
  const [deliveryDateFilter, setDeliveryDateFilter] = useState<string | null>(null);
  
  // Create initial filters object
  const initialFilters: OrderFilters = {
    paymentStatus: paymentStatusFilter,
    deliveryDate: deliveryDateFilter,
    searchTerm: searchTerm
  };
  
  // State for cancellation modal
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  
  // Use the hook with filters
  const { 
    orders, 
    loading, 
    error, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalCount,
    updateFilters,
    cancelOrder
  } = useOrders(initialFilters);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    
    try {
      setIsCancelling(true);
      setCancelError(null);
      
      await cancelOrder(cancelOrderId);
      
      // Close the modal after successful cancellation
      setCancelOrderId(null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar la orden');
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Update filters when they change
  const handlePaymentStatusFilterChange = () => {
    const newStatus = paymentStatusFilter === 'pending' ? null : 'pending';
    setPaymentStatusFilter(newStatus);
    updateFilters({
      paymentStatus: newStatus,
      deliveryDate: deliveryDateFilter,
      searchTerm: searchTerm
    });
  };
  
  const handleDeliveryDateFilterChange = () => {
    const newDate = deliveryDateFilter === 'today' ? null : 'today';
    setDeliveryDateFilter(newDate);
    updateFilters({
      paymentStatus: paymentStatusFilter,
      deliveryDate: newDate,
      searchTerm: searchTerm
    });
  };
  
  // Reference for search timeout (debounce)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Handle search term changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    // Clear previous timeout if exists
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Set new timeout to update filters after user stops typing
    searchTimeout.current = setTimeout(() => {
      updateFilters({
        paymentStatus: paymentStatusFilter,
        deliveryDate: deliveryDateFilter,
        searchTerm: newSearchTerm
      });
    }, 300); // 300ms debounce
  };
  
  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);
  
  // All orders are now filtered on the server
  const paginatedOrders = orders;
  
  // No debug logs to avoid exposing sensitive data

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }
  
  // Cancellation confirmation modal
  const CancellationModal = () => {
    if (!cancelOrderId) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Confirmar cancelación</h3>
          <p className="mb-6">¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer.</p>
          
          {cancelError && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
              {cancelError}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCancelOrderId(null)}
              disabled={isCancelling}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300"
            >
              {isCancelling ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Cancellation Modal */}
      {cancelOrderId && <CancellationModal />}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gestión de Órdenes</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente o número de orden..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-start items-center gap-4 p-4 border-b border-gray-200">
          <button
            onClick={handlePaymentStatusFilterChange}
            className={`px-4 py-2 rounded-lg border ${paymentStatusFilter === 'pending' ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Pendientes
          </button>
          <button
            onClick={handleDeliveryDateFilterChange}
            className={`px-4 py-2 rounded-lg border ${deliveryDateFilter === 'today' ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Entregas de Hoy
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {paginatedOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-gray-500">
                      Orden #{order.id.slice(0, 8)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Cancel Order button - only show for pending orders with all pending deliveries */}
                  {order.status === 'pending' && 
                   order.deliveries.every(delivery => delivery.status === 'pending') && 
                   order.deliveries.every(delivery => 
                     delivery.meals.every(meal => meal.status === 'pending')
                   ) && (
                    <button
                      onClick={() => setCancelOrderId(order.id)}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                    >
                      <Ban className="w-4 h-4" />
                      Cancelar
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ChevronDown
                      className={`w-6 h-6 transition-transform ${
                        expandedOrders.includes(order.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedOrders.includes(order.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-medium mb-4">Entregas programadas</h4>
                        <div className="space-y-6">
                          {order.deliveries.map((delivery) => (
                            <div
                              key={delivery.id}
                              className="bg-gray-50 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className="font-medium">
                                    {formatDate(delivery.scheduled_date)}
                                  </p>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_COLORS[delivery.status]}`}>
                                    {STATUS_LABELS[delivery.status]}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {delivery.meals.map((meal) => (
                                  <div
                                    key={meal.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                      meal.status === 'completed'
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-gray-200 bg-white'
                                    }`}
                                  >
                                    <img
                                      src={meal.image}
                                      alt={meal.name}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium">{meal.name}</p>
                                      <p className="text-sm text-gray-600">{meal.description}</p>
                                    </div>
                                    {meal.status === 'completed' && (
                                      <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Completada
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {delivery.delivered_at && (
                                <p className="text-sm text-gray-600 mt-3">
                                  Entregado: {formatDate(delivery.delivered_at)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Información del usuario</h4>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <p className="font-medium">{order.user?.display_name || 'Usuario sin nombre'}</p>
                          {order.user && (
                            <p className="text-gray-600">Email: {order.user.email}</p>
                          )}
                        </div>

                        <h4 className="font-medium mb-4">Datos de entrega</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium">{order.delivery_address_data.recipientName}</p>
                          <p className="text-gray-600">{order.delivery_address_data.phone}</p>
                          <p className="text-gray-600">{order.delivery_address_data.address}</p>
                          <p className="text-gray-600">
                            {order.delivery_address_data.municipality}, {order.delivery_address_data.province}
                          </p>
                        </div>

                        {order.personal_note && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Nota personal</h4>
                            <p className="text-gray-600 italic">"{order.personal_note}"</p>
                          </div>
                        )}

                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Detalles del paquete</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium">{order.package_data.name}</p>
                            <p className="text-gray-600">{order.package_data.meals} comidas</p>
                            <p className="text-gray-600">Total: ${order.total}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {totalCount > 0 ? (
                <>Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount} resultados</>
              ) : (
                <>No hay resultados</>
              )}
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-500 hover:text-red-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    currentPage === page
                      ? 'bg-red-500 text-white'
                      : 'hover:bg-red-50 text-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-500 hover:text-red-500 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
