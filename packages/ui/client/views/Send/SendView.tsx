import { Button, Input, Label } from '@stablepay/ui-base';
import { useState } from 'react';

import type { SendProps } from './SendInterface';

export const SendView = ({ onSend, isLoading }: SendProps) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSend) {
      onSend(address, amount);
    }
  };

  return (
    <div className='flex flex-col gap-4 p-4 max-w-md mx-auto w-full'>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='address'>Recipient Address</Label>
        <Input
          id='address'
          placeholder='0x...'
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='amount'>Amount</Label>
        <Input
          id='amount'
          type='number'
          placeholder='0.00'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          step='any'
        />
      </div>
      <Button className='w-full' onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </Button>
    </div>
  );
};
