import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DeliveryMeal } from './useOrderDeliveries';

export interface OrderDelivery {
  id: string;
  scheduled_date: string;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'failed';
  delivered_at?: string;
  notes?: string;
  meals: DeliveryMeal[];
}

export interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

export interface OrderWithDetails {
  id: string;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  package_data: {
    id: string;
    name: string;
    meals: number;
    price: number;
  };
  delivery_address_data: {
    recipient_name: string;
    phone: string;
    address: string;
    province: string;
    municipality: string;
  };
  personal_note?: string;
  total: number;
  user_id: string;
  deliveries: OrderDelivery[];
  user?: User;
}

export interface OrderFilters {
  paymentStatus: string | null;
  deliveryDate: string | null;
  searchTerm?: string;
}

export function useOrders(initialFilters: OrderFilters = { paymentStatus: null, deliveryDate: null }) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
  const ITEMS_PER_PAGE = 10;

  // Function to update filters and reset pagination
  const updateFilters = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const fetchTotalCount = async () => {
    try {
      // Start with base query
      let query = supabase
        .from('orders')
        .select('*, payment_orders!inner(*)', { count: 'exact', head: true })
        .eq('payment_orders.status', 'completed');
      
    // Apply filters
    if (filters.paymentStatus) {
      query = query.eq('status', filters.paymentStatus);
    }
    
    // Apply search term filter
    let isPartialUUID = false;
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = filters.searchTerm.trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
      isPartialUUID = /^[0-9a-f]{1,8}$/i.test(searchTerm);

      if (isUUID) {
        // For full UUIDs, use exact match
        query = query.eq('id', searchTerm);
      } else if (isPartialUUID) {
        // For partial UUIDs, we'll rely on client-side filtering
        // This is safer than trying to use complex PostgreSQL casting in the API
        // We'll fetch all orders and filter them client-side
      } else {
        // For non-UUID searches, search recipient name only
        query = query.ilike('delivery_address_data->>recipient_name', '%' + searchTerm + '%');
      }
    }
    
    // We don't apply the delivery date filter here for the count
    // We'll filter the results after fetching
      
      const { count, error } = await query;
        
      if (error) {
        console.error('Error fetching total count:', error);
        return;
      }
      
      console.log('Total count fetched:', count);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching total count:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start with base query
      let query = supabase
        .from('orders')
        .select(`
          *,
          payment_orders!inner(*),
          order_deliveries(
            *,
            delivery_meals(
              id,
              status,
              completed_at,
              meals (
                id,
                name,
                description,
                image_url
              )
            )
          )
        `)
        .eq('payment_orders.status', 'completed');
      
    // Apply filters
    if (filters.paymentStatus) {
      query = query.eq('status', filters.paymentStatus);
    }
    
    // Apply search term filter
    let isPartialUUID = false;
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = filters.searchTerm.trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
      isPartialUUID = /^[0-9a-f]{1,8}$/i.test(searchTerm);

      if (isUUID) {
        // For full UUIDs, use exact match
        query = query.eq('id', searchTerm);
      } else if (isPartialUUID) {
        // For partial UUIDs, we'll rely on client-side filtering
        // This is safer than trying to use complex PostgreSQL casting in the API
        // We'll fetch all orders and filter them client-side
      } else {
        // For non-UUID searches, search recipient name only
        query = query.ilike('delivery_address_data->>recipient_name', '%' + searchTerm + '%');
      }
    }
    
    // We don't apply the delivery date filter in the query
    // We'll filter the results after fetching
      
      // Apply pagination and ordering
      const { data: ordersData, error: ordersError } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (ordersError) {
        console.error('Supabase query error:', ordersError);
        throw new Error('Error al buscar órdenes. Por favor intente con términos de búsqueda diferentes.');
      }

      // Transform the data and apply delivery date filter if needed
      let transformedOrders = (ordersData || []).map(order => {
        // If we're searching by ID, we need to check if the order ID contains the search term
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
          const searchTerm = filters.searchTerm.trim().toLowerCase();
          // Add a flag to indicate if this order matches the search term
          // This will be used for client-side filtering if the server-side search doesn't work
          (order as any).matchesSearch = 
            order.id.toLowerCase().includes(searchTerm) || 
            (order.delivery_address_data?.recipient_name || '').toLowerCase().includes(searchTerm);
        }
        // Transform deliveries and meals
        const deliveriesWithMeals = (order.order_deliveries || []).map((delivery: any) => {
          const meals = (delivery.delivery_meals || []).map((mealData: any) => {
            const mealInfo = mealData.meals as any;
            return {
              id: mealInfo?.id || '',
              name: mealInfo?.name || '',
              description: mealInfo?.description || '',
              image: mealInfo?.image_url || '',
              status: mealData.status,
              completed_at: mealData.completed_at
            };
          });

          return {
            ...delivery,
            meals
          };
        });

        return {
          ...order,
          deliveries: deliveriesWithMeals,
          // We don't have a public.users table, so we set user to null
          user: null
        };
      });

      // Single log for the entire operation
      await supabase.rpc('http_request_log', {
        message: `Orders fetched: ${transformedOrders?.length || 0} (page ${currentPage})`,
        method: 'GET',
        path: '/orders/complete'
      });

      // Apply filters client-side if needed
      // First, apply delivery date filter if needed
      if (filters.deliveryDate === 'today') {
        const today = new Date();
        transformedOrders = transformedOrders.filter(order => {
          return order.deliveries.some((delivery: OrderDelivery) => {
            const scheduledDate = new Date(delivery.scheduled_date);
            return scheduledDate.getDate() === today.getDate() &&
              scheduledDate.getMonth() === today.getMonth() &&
              scheduledDate.getFullYear() === today.getFullYear();
          });
        });
        
        // Update total count for today's deliveries
        setTotalCount(transformedOrders.length);
      }
      
      // If we're searching with a partial UUID or server-side search didn't work, try client-side
      if (filters.searchTerm && filters.searchTerm.trim() !== '' && 
          (isPartialUUID || transformedOrders.length === 0)) {
        console.log('Server-side search returned no results, trying client-side search');
        // Fetch all orders without search filter
        const { data: allOrdersData } = await supabase
          .from('orders')
          .select(`
            *,
            payment_orders!inner(*),
            order_deliveries(
              *,
              delivery_meals(
                id,
                status,
                completed_at,
                meals (
                  id,
                  name,
                  description,
                  image_url
                )
              )
            )
          `)
          .eq('payment_orders.status', 'completed')
          .order('created_at', { ascending: false });
          
        if (allOrdersData && allOrdersData.length > 0) {
          // Transform all orders
          const allTransformedOrders = allOrdersData.map(order => {
            const deliveriesWithMeals = (order.order_deliveries || []).map((delivery: any) => {
              const meals = (delivery.delivery_meals || []).map((mealData: any) => {
                const mealInfo = mealData.meals as any;
                return {
                  id: mealInfo?.id || '',
                  name: mealInfo?.name || '',
                  description: mealInfo?.description || '',
                  image: mealInfo?.image_url || '',
                  status: mealData.status,
                  completed_at: mealData.completed_at
                };
              });

              return {
                ...delivery,
                meals
              };
            });

            return {
              ...order,
              deliveries: deliveriesWithMeals,
              user: null
            };
          });
          
          // Filter by search term
          const searchTerm = filters.searchTerm.trim().toLowerCase();
          transformedOrders = allTransformedOrders.filter(order => 
            order.id.toLowerCase().includes(searchTerm) || 
            (order.delivery_address_data?.recipient_name || '').toLowerCase().includes(searchTerm)
          );
          
          // Apply pagination manually
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const endIndex = startIndex + ITEMS_PER_PAGE;
          transformedOrders = transformedOrders.slice(startIndex, endIndex);
          
          // Update total count
          setTotalCount(transformedOrders.length);
        }
      }
      
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data when page or filters change
    fetchOrders();
    fetchTotalCount();

    // Set up real-time subscription with more specific filters
    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, () => {
        // Only refetch data when orders are updated
        fetchOrders();
        fetchTotalCount();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payment_orders',
        filter: 'status=eq.completed'
      }, () => {
        // Only refetch when a new completed payment is inserted
        fetchOrders();
        fetchTotalCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentPage, filters]); // Add filters as a dependency

  // Calculate total pages based on total count
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return {
    orders,
    loading,
    error,
    currentPage,
    totalCount,
    totalPages,
    setCurrentPage,
    filters,
    updateFilters,
    refetch: fetchOrders
  };
}
