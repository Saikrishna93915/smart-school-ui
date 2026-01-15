import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Building, 
  FileText, 
  IndianRupee,
  Check
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  enabled: boolean;
}

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  methods?: PaymentMethod[];
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  methods = defaultMethods
}) => {
  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Select Payment Method</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => method.enabled && onChange(method.id)}
            disabled={!method.enabled}
            className={`
              relative p-4 border rounded-lg text-left transition-all
              ${value === method.id 
                ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${!method.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {value === method.id && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-blue-500" />
              </div>
            )}
            
            <div className={`p-2 rounded-lg w-fit ${method.color} mb-3`}>
              <method.icon className="h-5 w-5 text-white" />
            </div>
            
            <div className="font-medium text-gray-900 mb-1">{method.name}</div>
            <div className="text-xs text-gray-600">{method.description}</div>
            
            {!method.enabled && (
              <Badge variant="outline" className="mt-2 text-xs">
                Coming Soon
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const defaultMethods: PaymentMethod[] = [
  {
    id: 'UPI',
    name: 'UPI',
    description: 'Instant payment via UPI',
    icon: Smartphone,
    color: 'bg-purple-500',
    enabled: true
  },
  {
    id: 'Card',
    name: 'Card',
    description: 'Credit/Debit Card',
    icon: CreditCard,
    color: 'bg-blue-500',
    enabled: true
  },
  {
    id: 'NetBanking',
    name: 'Net Banking',
    description: 'Internet banking',
    icon: Building,
    color: 'bg-green-500',
    enabled: true
  },
  {
    id: 'BankTransfer',
    name: 'Bank Transfer',
    description: 'NEFT/RTGS/IMPS',
    icon: Banknote,
    color: 'bg-teal-500',
    enabled: true
  },
  {
    id: 'Cash',
    name: 'Cash',
    description: 'Cash payment',
    icon: IndianRupee,
    color: 'bg-amber-500',
    enabled: true
  },
  {
    id: 'Cheque',
    name: 'Cheque/DD',
    description: 'Cheque or Demand Draft',
    icon: FileText,
    color: 'bg-red-500',
    enabled: true
  }
];