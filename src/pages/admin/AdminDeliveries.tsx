import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle, XCircle, Truck, Calendar } from 'lucide-react';
import { useOrderDeliveries, OrderDelivery, DeliveryFilters } from '../../hooks/useOrderDeliveries';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  delivered: 'bg-purple-100 text-purple-800 border-purple-200',
  failed: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_ICONS = {
  pending: Clock,
  in_progress: Truck,
  ready: CheckCircle,
  delivered: CheckCircle,
  failed: XCircle
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En preparación',
  ready: 'Lista para entrega',
  delivered: 'Entregada',
  failed: 'Fallida'
};

export const AdminDeliveries: React.FC = () => {
  // Create initial filters object
  const initialFilters: DeliveryFilters = {
    status: null,
    deliveryDate: null,
    searchTerm: ''
  };
  
  // Use the hook with filters
  const { 
    deliveries, 
    loading, 
    error, 
    updateDeliveryStatus, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    totalCount,
    updateFilters
  } = useOrderDeliveries(initialFilters);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDeliveries, setExpandedDeliveries] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  
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
        status: statusFilter,
        deliveryDate: dateFilter,
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
  
  // Handle status filter changes
  const handleStatusFilterChange = (status: string) => {
    const newStatus = statusFilter === status ? null : status;
    setStatusFilter(newStatus);
    updateFilters({
      status: newStatus,
      deliveryDate: dateFilter,
      searchTerm: searchTerm
    });
  };
  
  // Handle date filter changes
  const handleDateFilterChange = () => {
    const newDate = dateFilter === 'today' ? null : 'today';
    setDateFilter(newDate);
    updateFilters({
      status: statusFilter,
      deliveryDate: newDate,
      searchTerm: searchTerm
    });
  };

  const toggleDeliveryExpansion = (deliveryId: string) => {
    setExpandedDeliveries(prev =>
      prev.includes(deliveryId)
        ? prev.filter(id => id !== deliveryId)
        : [...prev, deliveryId]
    );
  };

  const handleStatusChange = async (delivery: OrderDelivery, newStatus: OrderDelivery['status']) => {
    try {
      setUpdatingStatus(delivery.id);
      await updateDeliveryStatus(delivery.id, newStatus);
    } catch (err) {
      console.error('Error updating delivery status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleMealComplete = async (delivery: OrderDelivery, mealId: string) => {
    try {
      setUpdatingStatus(delivery.id);
      // Pass the meal ID in the expected format { id: mealId }
      await updateDeliveryStatus(delivery.id, 'in_progress', { id: mealId }); 
    } catch (err) {
      console.error('Error marking meal as completed:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'Fecha inválida'; // Handle potential null/undefined dates
    try {
      return new Date(date).toLocaleDateString('es', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", date, e);
      return 'Fecha inválida';
    }
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Gestión de Entregas</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente, número de entrega u orden..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-start items-center gap-4 p-4 border-b border-gray-200">
          <button
            onClick={() => handleStatusFilterChange('pending')}
            className={`px-4 py-2 rounded-lg border ${statusFilter === 'pending' ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Entregas Pendientes
          </button>
          <button
            onClick={() => handleStatusFilterChange('ready')}
            className={`px-4 py-2 rounded-lg border ${statusFilter === 'ready' ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Listas para Entrega
          </button>
          <button
            onClick={handleDateFilterChange}
            className={`px-4 py-2 rounded-lg border ${dateFilter === 'today' ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Entregas de Hoy
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {deliveries.map((delivery) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-gray-500">
                      Entrega #{delivery.id?.slice(0, 8) ?? 'N/A'} {/* Safe slice */}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[delivery.status] ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {STATUS_LABELS[delivery.status] ?? delivery.status}
                    </span>
                    <span className="text-sm text-gray-500 ml-auto">
                      Orden #{delivery.order_id?.slice(0, 8) ?? 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(delivery.scheduled_date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {delivery.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(delivery, 'in_progress')}
                      disabled={updatingStatus === delivery.id}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                    >
                      Iniciar preparación
                    </button>
                  )}
                  {delivery.status === 'ready' && (
                    <button
                      onClick={() => handleStatusChange(delivery, 'delivered')}
                      disabled={updatingStatus === delivery.id}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300"
                    >
                      Marcar como entregada
                    </button>
                  )}
                  <button
                    onClick={() => toggleDeliveryExpansion(delivery.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ChevronDown
                      className={`w-6 h-6 transition-transform ${
                        expandedDeliveries.includes(delivery.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedDeliveries.includes(delivery.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-medium mb-4">Comidas para esta entrega</h4>
                        <div className="space-y-4">
                          {delivery.meals?.map((meal) => ( // Safe map
                            <div
                              key={meal.id}
                              className={`flex items-center gap-4 p-4 rounded-lg border ${
                                meal.status === 'completed'
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-gray-200'
                              }`}
                            >
                              <img
                                src={meal.image}
                                alt={meal.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{meal.name ?? 'Nombre no disponible'}</p>
                                <p className="text-sm text-gray-600">{meal.description ?? 'Descripción no disponible'}</p>
                              </div>
                              {delivery.status === 'in_progress' && meal.status === 'pending' && (
                                <button
                                  onClick={() => handleMealComplete(delivery, meal.id)}
                                  disabled={updatingStatus === delivery.id}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300"
                                >
                                  Completada
                                </button>
                              )}
                              {meal.status === 'completed' && (
                                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5" />
                                  Completada
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Datos de entrega</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          {/* Safe navigation for nested properties */}
                          <p className="font-medium">{delivery.orders?.delivery_address_data?.recipientName ?? 'Nombre no disponible'}</p>
                          <p className="text-gray-600">{delivery.orders?.delivery_address_data?.phone ?? 'Teléfono no disponible'}</p>
                          <p className="text-gray-600">{delivery.orders?.delivery_address_data?.address ?? 'Dirección no disponible'}</p>
                          <p className="text-gray-600">
                            {delivery.orders?.delivery_address_data?.municipality ?? 'Municipio no disponible'}, {delivery.orders?.delivery_address_data?.province ?? 'Provincia no disponible'}
                          </p>
                        </div>

                        {delivery.orders?.personal_note && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Nota personal</h4>
                            <p className="text-gray-600 italic">"{delivery.orders.personal_note}"</p>
                          </div>
                        )}

                        {delivery.notes && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Notas de entrega</h4>
                            <p className="text-gray-600">{delivery.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                {totalCount > 0 ? (
                  <>Mostrando {((currentPage - 1) * 10) + 1} a {Math.min(currentPage * 10, totalCount)} de {totalCount} resultados</>
                ) : (
                  <>No hay resultados</>
                )}
              </span>
            </div>
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
          </div>
        )}
      </div>
    </div>
  );
};
