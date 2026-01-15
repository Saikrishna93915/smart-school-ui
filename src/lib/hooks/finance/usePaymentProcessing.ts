import { useState, useCallback } from 'react';
import { paymentService, PaymentRequest, PaymentResponse } from '@/Services/finance/paymentService'; // Changed to uppercase 'S'
import { validatePaymentAmount, validateTransactionId } from '@/lib/utils/finance/validation';

interface UsePaymentProcessingReturn {
  processing: boolean;
  error: string | null;
  success: boolean;
  paymentResponse: PaymentResponse | null;
  processPayment: (request: PaymentRequest) => Promise<PaymentResponse>;
  reset: () => void;
  validatePayment: (request: PaymentRequest, outstandingBalance: number) => string[];
}

export const usePaymentProcessing = (): UsePaymentProcessingReturn => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);

  const validatePayment = useCallback((
    request: PaymentRequest,
    outstandingBalance: number
  ): string[] => {
    const errors: string[] = [];
    
    // Validate amount
    const amountValidation = validatePaymentAmount(request.amount, outstandingBalance);
    if (!amountValidation.isValid) {
      errors.push(...amountValidation.errors);
    }
    
    // Validate transaction ID for non-cash payments
    if (request.paymentMethod !== 'Cash') {
      const transactionValidation = validateTransactionId(request.transactionId || '', request.paymentMethod);
      if (!transactionValidation.isValid) {
        errors.push(...transactionValidation.errors);
      }
    }
    
    // Validate date
    if (!request.transactionDate) {
      errors.push('Transaction date is required');
    }
    
    return errors;
  }, []);

  const processPayment = useCallback(async (request: PaymentRequest): Promise<PaymentResponse> => {
    setProcessing(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await paymentService.recordPayment(request);
      
      if (response.success) {
        setSuccess(true);
        setPaymentResponse(response);
      } else {
        setError(response.message);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      
      return {
        success: false,
        receiptNumber: '',
        message: errorMessage,
        errors: [errorMessage]
      };
    } finally {
      setProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProcessing(false);
    setError(null);
    setSuccess(false);
    setPaymentResponse(null);
  }, []);

  return {
    processing,
    error,
    success,
    paymentResponse,
    processPayment,
    reset,
    validatePayment
  };
};

/**
 * Hook for managing payment history
 */
export const usePaymentHistory = (studentId?: string) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (id?: string) => {
    const targetId = id || studentId;
    if (!targetId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = targetId 
        ? await paymentService.getStudentPayments(targetId)
        : await paymentService.getRecentPayments();
      
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const refresh = useCallback(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    refresh
  };
};