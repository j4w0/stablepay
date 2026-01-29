import { Button } from '@stablepay/ui-base';
import { Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import { toast } from 'sonner';

import type { PresentQRCodeProps } from './PresentQRCodeInterface';

export const PresentQRCodeView: React.FC<PresentQRCodeProps> = ({
  value,
  description = 'Present the QR code to pay',
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success('Address copied to clipboard');
  };

  return (
    <div className='flex flex-col items-center justify-center p-4 space-y-8 h-full'>
      <div className='bg-white p-4 rounded-xl shadow-sm'>
        <QRCodeSVG value={value} size={256} />
      </div>

      {description && (
        <p className='text-center text-muted-foreground max-w-sm'>
          {description}
        </p>
      )}

      <div className='flex flex-col items-center gap-2 w-full max-w-sm'>
        <div className='flex items-center justify-between w-full p-3 bg-muted rounded-lg border'>
          <p className='font-mono text-sm mr-2 break-all'>{value}</p>
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 shrink-0'
            onClick={handleCopy}
          >
            <Copy className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};
