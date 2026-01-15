/**
 * Validation utilities for financial data
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  export const validatePaymentAmount = (
    amount: number, 
    outstanding: number, 
    maxAmount?: number
  ): ValidationResult => {
    const errors: string[] = [];
    
    if (amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    
    if (amount > outstanding) {
      errors.push('Payment amount cannot exceed outstanding balance');
    }
    
    if (maxAmount && amount > maxAmount) {
      errors.push(`Amount cannot exceed maximum limit of ₹${maxAmount.toLocaleString('en-IN')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  export const validateTransactionId = (
    transactionId: string, 
    paymentMethod: string
  ): ValidationResult => {
    const errors: string[] = [];
    
    if (paymentMethod !== 'Cash' && !transactionId.trim()) {
      errors.push('Transaction ID is required for non-cash payments');
    }
    
    if (transactionId.length > 100) {
      errors.push('Transaction ID cannot exceed 100 characters');
    }
    
    // Basic pattern validation
    const patterns: Record<string, RegExp> = {
      'UPI': /^[\w\.\-_]+@[\w]+$/i,
      'Card': /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/,
      'BankTransfer': /^[A-Z0-9]{8,20}$/
    };
    
    if (patterns[paymentMethod] && !patterns[paymentMethod].test(transactionId)) {
      errors.push(`Invalid ${paymentMethod} transaction ID format`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  export const validateEmail = (email: string): ValidationResult => {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  export const validatePhone = (phone: string): ValidationResult => {
    const errors: string[] = [];
    const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;
    
    if (!phoneRegex.test(phone)) {
      errors.push('Please enter a valid Indian phone number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  export const validateDate = (date: string): ValidationResult => {
    const errors: string[] = [];
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      errors.push('Invalid date format');
    }
    
    if (dateObj > new Date()) {
      errors.push('Date cannot be in the future');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  export const validatePAN = (pan: string): ValidationResult => {
    const errors: string[] = [];
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    
    if (!panRegex.test(pan.toUpperCase())) {
      errors.push('Please enter a valid PAN number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };