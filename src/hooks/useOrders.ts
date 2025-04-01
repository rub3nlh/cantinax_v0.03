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

export function useOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Log the query we're about to make
      await supabase.rpc('http_request_log', {
        message: 'Fetching orders',
        method: 'GET',
        path: '/orders'
      });

      // First get all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // For each order, get its deliveries and meals
      const ordersWithDeliveries = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Get deliveries for this order
          const { data: deliveriesData, error: deliveriesError } = await supabase
            .from('order_deliveries')
            .select('*')
            .eq('order_id', order.id)
            .order('scheduled_date', { ascending: true });

          if (deliveriesError) throw deliveriesError;

          // For each delivery, get its meals
          const deliveriesWithMeals = await Promise.all(
            (deliveriesData || []).map(async (delivery) => {
              const { data: mealsData, error: mealsError } = await supabase
                .from('delivery_meals')
                .select(`
                  id,
                  status,
                  completed_at,
                  meals (
                    id,
                    name,
                    description,
                    image_url
                  )
                `)
                .eq('delivery_id', delivery.id);

              if (mealsError) throw mealsError;

              // Transform meals data
              const meals = (mealsData || []).map(mealData => {
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
            })
          );

          // Get user for this order
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', order.user_id)
            .single();

          if (userError) {
            console.error('Error fetching user:', userError);
          }

          return {
            ...order,
            deliveries: deliveriesWithMeals,
            user: userData || null,
          };
        })
      );

      // Log the response
      await supabase.rpc('http_request_log', {
        message: `Orders fetched: ${ordersWithDeliveries?.length || 0}`,
        method: 'GET',
        path: '/orders/result'
      });

      setOrders(ordersWithDeliveries);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  };
}
