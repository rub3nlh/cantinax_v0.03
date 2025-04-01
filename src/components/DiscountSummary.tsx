import React from 'react';

interface DiscountSummaryProps {
  code: string;
  discountPercentage: number;
  discountAmount: number;
}

export const DiscountSummary: React.FC<DiscountSummaryProps> = ({
  code,
  discountPercentage,
  discountAmount,
}) => {
  const formattedDiscount = discountPercentage.toFixed(0); // No decimal places for percentage
  const formattedAmount = discountAmount.toFixed(2); // Two decimal places for currency

  return (
    <div className="my-2 p-3 border border-green-200 rounded-md bg-green-50 text-sm text-gray-700">
      <p className="font-medium">
        Código aplicado: <span className="font-semibold">{code}</span>
      </p>
      <p>
        Descuento: <span className="font-semibold">{formattedDiscount}%</span> - ${formattedAmount}
      </p>
    </div>
  );
};
