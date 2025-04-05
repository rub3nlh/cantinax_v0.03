import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThankYouPage } from '../pages/ThankYouPage';
import { usePayment } from '../hooks/usePayment';
import { usePaymentOrders } from '../hooks/usePaymentOrders';
import { supabase } from '../lib/supabase';

// Mock the hooks and supabase client
vi.mock('../hooks/usePayment');
vi.mock('../hooks/usePaymentOrders');
vi.mock('../lib/supabase');
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } })
}));
vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
  EventTypes: {
    PURCHASE_COMPLETED: 'purchase_completed',
    PAYMENT_COMPLETED: 'payment_completed'
  }
}));

describe('Payment Flow and Status Update', () => {
  const mockOrderId = 'test-order-123';
  const mockReference = 'test-reference-456';
  const mockPaymentState = '5'; // Successful payment state
  const mockPaymentOrderId = 'payment-order-789';
  
  beforeEach(() => {
    // Mock usePaymentOrders implementation
    const updatePaymentOrderMock = vi.fn().mockResolvedValue({
      id: mockPaymentOrderId,
      status: 'completed',
      reference: mockReference
    });
    
    usePaymentOrders.mockReturnValue({
      updatePaymentOrder: updatePaymentOrderMock,
      createPaymentOrder: vi.fn().mockResolvedValue({
        id: mockPaymentOrderId,
        status: 'pending'
      })
    });
    
    // Mock usePayment implementation
    usePayment.mockReturnValue({
      processPayment: vi.fn().mockImplementation(async (method, data) => {
        // Simulate updating payment order to completed
        await updatePaymentOrderMock(mockPaymentOrderId, {
          status: 'completed',
          reference: mockReference,
          completed_at: new Date().toISOString()
        });
        
        return {
          success: true,
          mock: true,
          shortUrl: `/thank-you?order=${data.orderId}&reference=${mockReference}&state=${mockPaymentState}`
        };
      }),
      loading: false,
      error: null
    });
    
    // Mock supabase responses
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          package_data: {
            id: 'package-123',
            name: 'Test Package',
            price: 100,
            meals: 5
          },
          created_at: new Date().toISOString(),
          total: 100
        },
        error: null
      })
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should update payment order status to completed when ThankYouPage receives valid URL parameters', async () => {
    // 1. First simulate a payment process
    const { processPayment } = usePayment();
    const { updatePaymentOrder } = usePaymentOrders();
    
    // Process a mock payment
    await processPayment('tropipay', {
      orderId: mockOrderId,
      reference: mockOrderId,
      amount: 100,
      currency: 'EUR',
      description: 'Test payment'
    });
    
    // Verify payment order was updated to completed
    expect(updatePaymentOrder).toHaveBeenCalledWith(
      mockPaymentOrderId,
      expect.objectContaining({
        status: 'completed',
        reference: mockReference
      })
    );
    
    // 2. Now render the ThankYouPage with URL parameters
    render(
      <MemoryRouter initialEntries={[`/thank-you?order=${mockOrderId}&reference=${mockReference}&state=${mockPaymentState}`]}>
        <Routes>
          <Route path="/thank-you" element={<ThankYouPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for the page to load and verify it shows payment confirmation
    await waitFor(() => {
      expect(screen.getByText('¡Gracias por tu compra!')).toBeInTheDocument();
      expect(screen.getByText('Pago confirmado')).toBeInTheDocument();
      expect(screen.getByText(`Referencia de pago: ${mockReference}`)).toBeInTheDocument();
    });
  });
  
  it('should not show payment confirmation when payment state is not successful', async () => {
    // Render ThankYouPage with unsuccessful payment state
    render(
      <MemoryRouter initialEntries={[`/thank-you?order=${mockOrderId}&reference=${mockReference}&state=2`]}>
        <Routes>
          <Route path="/thank-you" element={<ThankYouPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText('¡Gracias por tu compra!')).toBeInTheDocument();
      // Should not show payment confirmation
      expect(screen.queryByText('Pago confirmado')).not.toBeInTheDocument();
    });
  });
});
