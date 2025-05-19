import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminCounts() {
  const [counts, setCounts] = useState({
    pendingOrders: 0,
    pendingDeliveries: 0,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Get count of pending orders with completed payments
        const { count: pendingOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*, payment_orders!inner(*)', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('payment_orders.status', 'completed');

        if (ordersError) throw ordersError;

        // Get count of pending deliveries for orders with completed payments
        const { count: pendingDeliveries, error: deliveriesError } = await supabase
          .from('order_deliveries')
          .select('*, orders!inner(*, payment_orders!inner(*))', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('orders.payment_orders.status', 'completed');

        if (deliveriesError) throw deliveriesError;

        setCounts({
          pendingOrders: pendingOrders || 0,
          pendingDeliveries: pendingDeliveries || 0,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Error fetching admin counts:', err);
        setCounts(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar los contadores'
        }));
      }
    };

    fetchCounts();

    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    const deliveriesSubscription = supabase
      .channel('deliveries-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_deliveries'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    const paymentsSubscription = supabase
      .channel('payments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payment_orders'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      deliveriesSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  }, []);

  return counts;
}
