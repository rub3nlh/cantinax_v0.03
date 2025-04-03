import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface DeliveryMeal {
  id: string;
  name: string;
  description: string;
  image: string;
  status: 'pending' | 'completed';
  completed_at?: string;
}

export interface OrderDelivery {
  id: string;
  order_id: string;
  scheduled_date: string;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'failed';
  delivered_at?: string;
  notes?: string;
  created_at: string;
  meals: DeliveryMeal[];
  orders: {
    delivery_address_data: {
      recipientName: string;
      phone: string;
      address: string;
      province: string;
      municipality: string;
    };
    personal_note?: string;
  };
}

export interface DeliveryFilters {
  status: string | null;
  deliveryDate: string | null;
  searchTerm?: string;
}

export function useOrderDeliveries(initialFilters: DeliveryFilters = { status: null, deliveryDate: null }) {
  const [deliveries, setDeliveries] = useState<OrderDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<DeliveryFilters>(initialFilters);
  const ITEMS_PER_PAGE = 10;

  // Function to update filters and reset pagination
  const updateFilters = (newFilters: DeliveryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  // Reference for search timeout (debounce)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchTotalCount = async () => {
    try {
      // Get all deliveries for orders with completed payments
      let query = supabase
        .from('order_deliveries')
        .select(`
          id,
          orders!inner(
            payment_orders!inner(status)
          )
        `)
        .eq('orders.payment_orders.status', 'completed');
      
      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // Apply date filter for today's deliveries
      if (filters.deliveryDate === 'today') {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
        query = query.gte('scheduled_date', `${todayStr}T00:00:00`)
                     .lt('scheduled_date', `${todayStr}T23:59:59`);
      }
      
      // Apply search term filter
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
        const isPartialUUID = /^[0-9a-f]{1,8}$/i.test(searchTerm);

        if (isUUID) {
          // For full UUIDs, use exact match
          query = query.or(`id.eq.${searchTerm},order_id.eq.${searchTerm}`);
        } else if (isPartialUUID) {
          // For partial UUIDs, we'll rely on client-side filtering
          // This is safer than trying to use complex PostgreSQL casting in the API
          // We'll fetch all deliveries and filter them client-side
        } else {
          // For non-UUID searches, search recipient name
          query = query.ilike('orders.delivery_address_data->>recipientName', `%${searchTerm}%`);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching total count:', error);
        return;
      }
      
      // Set total count to the number of deliveries
      setTotalCount(data?.length || 0);
      
      // Log the total count for debugging
      console.log(`Total deliveries: ${data?.length || 0}`);
    } catch (err) {
      console.error('Error fetching total count:', err);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start with base query that joins with orders and payment_orders
      let query = supabase
        .from('order_deliveries')
        .select(`
          *,
          orders!inner(
            *,
            payment_orders!inner(*)
          ),
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
        `)
        .eq('orders.payment_orders.status', 'completed');
      
      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // Apply date filter for today's deliveries
      if (filters.deliveryDate === 'today') {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
        query = query.gte('scheduled_date', `${todayStr}T00:00:00`)
                     .lt('scheduled_date', `${todayStr}T23:59:59`);
      }
      
      // Apply search term filter
      let isPartialUUID = false;
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
        isPartialUUID = /^[0-9a-f]{1,8}$/i.test(searchTerm);

        if (isUUID) {
          // For full UUIDs, use exact match
          query = query.or(`id.eq.${searchTerm},order_id.eq.${searchTerm}`);
        } else if (isPartialUUID) {
          // For partial UUIDs, we'll rely on client-side filtering
          // This is safer than trying to use complex PostgreSQL casting in the API
          // We'll fetch all deliveries and filter them client-side
        } else {
          // For non-UUID searches, search recipient name
          query = query.ilike('orders.delivery_address_data->>recipientName', `%${searchTerm}%`);
        }
      }

      // Apply pagination and ordering
      const { data: deliveriesData, error: deliveriesError } = await query
        .order('scheduled_date', { ascending: true })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (deliveriesError) throw deliveriesError;

      // Transform the data
      const transformedDeliveries = (deliveriesData || []).map(delivery => {
        // Transform meals data
        const meals = (delivery.delivery_meals || []).map((mealData: any) => ({
          id: mealData.meals.id,
          name: mealData.meals.name,
          description: mealData.meals.description,
          image: mealData.meals.image_url,
          status: mealData.status,
          completed_at: mealData.completed_at
        }));

        return {
          ...delivery,
          meals
        };
      });

      // Apply client-side filtering for partial UUIDs
      let filteredDeliveries = transformedDeliveries;
      
      // If we're searching with a partial UUID, apply client-side filtering
      if (filters.searchTerm && filters.searchTerm.trim() !== '' && isPartialUUID) {
        const searchTerm = filters.searchTerm.trim().toLowerCase();
        filteredDeliveries = transformedDeliveries.filter(delivery => 
          delivery.id.toLowerCase().includes(searchTerm) || 
          delivery.order_id.toLowerCase().includes(searchTerm)
        );
        
        // If no results found with server-side filtering, try to fetch all deliveries and filter client-side
        if (filteredDeliveries.length === 0) {
          // Fetch all deliveries without search filter
          const { data: allDeliveriesData } = await supabase
            .from('order_deliveries')
            .select(`
              *,
              orders!inner(
                *,
                payment_orders!inner(*)
              ),
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
            `)
            .eq('orders.payment_orders.status', 'completed')
            .order('scheduled_date', { ascending: true });
            
          if (allDeliveriesData && allDeliveriesData.length > 0) {
            // Transform all deliveries
            const allTransformedDeliveries = allDeliveriesData.map(delivery => {
              // Transform meals data
              const meals = (delivery.delivery_meals || []).map((mealData: any) => ({
                id: mealData.meals.id,
                name: mealData.meals.name,
                description: mealData.meals.description,
                image: mealData.meals.image_url,
                status: mealData.status,
                completed_at: mealData.completed_at
              }));
  
              return {
                ...delivery,
                meals
              };
            });
            
            // Filter by search term
            filteredDeliveries = allTransformedDeliveries.filter(delivery => 
              delivery.id.toLowerCase().includes(searchTerm) || 
              delivery.order_id.toLowerCase().includes(searchTerm)
            );
            
            // Apply pagination manually
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            filteredDeliveries = filteredDeliveries.slice(startIndex, endIndex);
            
            // Update total count
            setTotalCount(filteredDeliveries.length);
          }
        }
      }
      
      setDeliveries(filteredDeliveries);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Error al cargar las entregas');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (
    deliveryId: string,
    status: OrderDelivery['status'],
    completedMeal?: { id: string }
  ) => {
    try {
      let updateData: any = { status };

      // If marking as delivered, add timestamp
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      // First, get the order_id for this delivery
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('order_deliveries')
        .select('order_id')
        .eq('id', deliveryId)
        .single();

      if (deliveryError) throw deliveryError;

      const orderId = deliveryData.order_id;

      // Update delivery status
      const { error: updateError } = await supabase
        .from('order_deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (updateError) throw updateError;

      // If completing a meal, update its status
      if (completedMeal) {
        const { error: mealError } = await supabase
          .from('delivery_meals')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('delivery_id', deliveryId)
          .eq('meal_id', completedMeal.id);

        if (mealError) throw mealError;

        // Check if all meals are completed to mark delivery as ready
        const { data: mealsData, error: mealsCheckError } = await supabase
          .from('delivery_meals')
          .select('status')
          .eq('delivery_id', deliveryId);

        if (mealsCheckError) throw mealsCheckError;

        const allCompleted = mealsData?.every(meal => meal.status === 'completed');
        if (allCompleted) {
          const { error: readyError } = await supabase
            .from('order_deliveries')
            .update({ status: 'ready' })
            .eq('id', deliveryId);

          if (readyError) throw readyError;
        }
      }

      // If marking as delivered, update the order status to completed
      if (status === 'delivered') {
        console.log(`Delivery ${deliveryId} marked as delivered for order ${orderId}`);
        
        try {
          // First, check current order status
          const { data: orderData, error: orderCheckError } = await supabase
            .from('orders')
            .select('status, id')
            .eq('id', orderId)
            .single();
            
          if (orderCheckError) {
            console.error('Error checking order status:', orderCheckError);
          } else {
            console.log(`Current order status for order ${orderId}: ${orderData.status}`);
            
            // Get all deliveries for this order to check if all are delivered
            const { data: orderDeliveries, error: orderDeliveriesError } = await supabase
              .from('order_deliveries')
              .select('id, status')
              .eq('order_id', orderId);

            if (orderDeliveriesError) {
              console.error('Error fetching order deliveries:', orderDeliveriesError);
            } else {
              console.log('All deliveries for this order:', orderDeliveries);

              // Check if all deliveries are now in 'delivered' status
              const allDelivered = orderDeliveries && 
                                  orderDeliveries.length > 0 && 
                                  orderDeliveries.every(delivery => delivery.status === 'delivered');

              console.log(`All deliveries delivered? ${allDelivered}`);

              // If all deliveries are delivered, update the order status to 'completed'
              if (allDelivered) {
                console.log(`Attempting to update order ${orderId} status to completed`);
                
                // Try a direct update with a simpler query
                const { data: updateResult, error: orderUpdateError } = await supabase
                  .from('orders')
                  .update({ status: 'completed' })
                  .eq('id', orderId)
                  .select();

                if (orderUpdateError) {
                  console.error('Error updating order status to completed:', orderUpdateError);
                  
                  // Try using the manual update function we created
                  console.log('Trying manual update function...');
                  const { data: manualUpdateResult, error: manualUpdateError } = await supabase.rpc('manual_update_order_status', {
                    order_id: orderId
                  });
                  
                  if (manualUpdateError) {
                    console.error('Manual update failed:', manualUpdateError);
                  } else {
                    console.log('Manual update result:', manualUpdateResult);
                  }
                } else {
                  console.log('Order update result:', updateResult);
                }
              }
            }
          }
        } catch (updateError) {
          console.error('Error in order status update process:', updateError);
        }
      }

      // Refetch deliveries to update UI
      await fetchDeliveries();
      await fetchTotalCount();

      return true;
    } catch (err) {
      console.error('Error updating delivery status:', err);
      throw err;
    }
  };

  useEffect(() => {
    // Fetch data when page or filters change
    fetchDeliveries();
    fetchTotalCount();

    // Set up real-time subscription
    const subscription = supabase
      .channel('order-deliveries-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_deliveries'
      }, () => {
        fetchDeliveries();
        fetchTotalCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentPage, filters]); // Add filters and currentPage as dependencies

  // Calculate total pages based on total count
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return {
    deliveries,
    loading,
    error,
    currentPage,
    totalCount,
    totalPages,
    setCurrentPage,
    filters,
    updateFilters,
    updateDeliveryStatus,
    refetch: fetchDeliveries
  };
}
