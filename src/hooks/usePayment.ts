import { useState } from "react";
import { PaymentMethod } from "../types";
import { usePaymentOrders } from "./usePaymentOrders";
import { supabase } from "../lib/supabase";

interface TropiPayData {
  reference: string;
  concept: string;
  amount: number;
  currency: string;
  description: string;
  urlSuccess: string;
  urlFailed: string;
  urlNotification?: string;
  client?: {
    name: string;
    lastName: string;
    address: string;
    phone: string;
    email: string;
    countryIso: string;
  };
  orderId: string;
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createPaymentOrder, updatePaymentOrder } = usePaymentOrders();

  const createTropiPayLink = async (data: TropiPayData) => {
    try {
      setLoading(true);
      setError(null);

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session found");
      }

      // Create payment order first with status 'pending'
      const paymentOrder = await createPaymentOrder({
        order_id: data.orderId,
        payment_method: "tropipay",
        amount: data.amount,
        currency: data.currency,
        description: data.description,
      });

      try {
        // Create payment link via API
        const response = await fetch(
          `${window.location.origin}/api/payments/create-payment-link`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              reference: data.reference,
              concept: data.concept,
              amount: data.amount,
              currency: data.currency,
              description: data.description,
              urlSuccess: data.urlSuccess,
              urlFailed: data.urlFailed,
              urlNotification: data.urlNotification,
              client: data.client,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error creando link de pago");
        }

        const paymentResult = await response.json();

        // Update payment order with payment link data
        await updatePaymentOrder(paymentOrder.id, {
          reference: paymentResult.id || paymentResult._id,
          short_url:
            paymentResult.shortUrl || `https://tppay.me/${paymentResult.hash}`,
        });

        return {
          success: true,
          ...paymentResult,
          shortUrl:
            paymentResult.shortUrl || `https://tppay.me/${paymentResult.hash}`,
        };
      } catch (err) {
        // Update payment order with error status
        await updatePaymentOrder(paymentOrder.id, {
          status: "failed",
          error_message:
            err instanceof Error ? err.message : "Error creando link de pago",
        });
        throw err;
      }
    } catch (err) {
      console.error("Error creando link de TropiPay:", err);
      setError(
        err instanceof Error ? err.message : "Error creando link de pago"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (method: PaymentMethod, data: any) => {
    switch (method) {
      case "tropipay":
        return createTropiPayLink(data);
      default:
        throw new Error("Método de pago no soportado");
    }
  };

  return {
    processPayment,
    loading,
    error,
  };
}
