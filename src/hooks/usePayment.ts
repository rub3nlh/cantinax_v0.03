import { useState, useEffect } from "react";
import { PaymentMethod } from "../types";
import { usePaymentOrders } from "./usePaymentOrders";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface CardPaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  amount: number;
}

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
    countryId: number;
  };
  orderId: string;
}

export function usePayment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createPaymentOrder, updatePaymentOrder } = usePaymentOrders();
  const [useServerFallback, setUseServerFallback] = useState(true);

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

      // Create payment order first
      const paymentOrder = await createPaymentOrder({
        order_id: data.orderId,
        payment_method: "tropipay",
        amount: data.amount,
        currency: data.currency,
        description: data.description,
      });

      try {
        // If mock payment is enabled, simulate successful payment
        if (import.meta.env.VITE_MOCK_PAYMENT === "true") {
          console.log("Mock payment enabled, simulating successful payment");

          // Update payment order as completed
          await updatePaymentOrder(paymentOrder.id, {
            status: "completed",
            reference: `mock_${Date.now()}`,
            completed_at: new Date().toISOString(),
          });

          // Update order status to completed
          await supabase
            .from("orders")
            .update({ status: "completed" })
            .eq("id", data.orderId);

          // Get order details for thank you page
          const { data: orderData } = await supabase
            .from("orders")
            .select("package_data, created_at")
            .eq("id", data.orderId)
            .single();

          // Navigate to thank you page
          navigate("/thank-you", {
            state: {
              package: orderData?.package_data,
              purchaseDate: orderData?.created_at || new Date(),
            },
          });

          return {
            success: true,
            mock: true,
            shortUrl: data.urlSuccess,
          };
        }

        // Otherwise, proceed with real TropiPay integration
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
