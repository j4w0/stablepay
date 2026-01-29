import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import React from 'react';
import { SubPageLayout } from '../../components/SubPageLayout/SubPageLayout';
import { type TransactionHistoryViewProps } from './TransactionHistoryInterface';

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  isLoading,
}) => {
  return (
    <SubPageLayout title='Transaction History'>
      <div className='space-y-4'>
        {isLoading ? (
          <div className='text-center text-muted-foreground p-4'>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className='text-center text-muted-foreground p-4'>
            No transactions found
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className='flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm'
            >
              <div className='flex items-center gap-4'>
                <div
                  className={`p-2 rounded-full ${
                    tx.type === 'send'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
                  {tx.type === 'send' ? (
                    <ArrowUpRight className='w-4 h-4' />
                  ) : (
                    <ArrowDownLeft className='w-4 h-4' />
                  )}
                </div>
                <div>
                  <div className='font-medium'>
                    {tx.type === 'send' ? 'Sent' : 'Received'}
                  </div>
                  <div className='text-sm text-muted-foreground'>{tx.date}</div>
                </div>
              </div>
              <div className='text-right'>
                <div
                  className={`font-bold ${
                    tx.type === 'send' ? 'text-destructive' : 'text-green-600'
                  }`}
                >
                  {tx.type === 'send' ? '-' : '+'}
                  {tx.amount} {tx.currency}
                </div>
                <div className='text-xs text-muted-foreground capitalize'>
                  {tx.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </SubPageLayout>
  );
};
