import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
  Label,
} from '@stablepay/ui-base';
import { createFileRoute } from '@tanstack/react-router';
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/scan')({
  component: ScanPage,
});

function ScanPage() {
  const [scanned, setScanned] = useState(false);
  const [amount, setAmount] = useState('');

  const handleScan = (result: IDetectedBarcode[]) => {
    if (scanned) return;
    const value = result[0]?.rawValue;
    if (value) {
      setScanned(true);
      toast.success(`Scanned: ${value}`);
      // Future: Navigate to send page or process the scanned data
      // For now, just pause/stop or show success
      setTimeout(() => setScanned(false), 2000); // Reset for demo
    }
  };

  const handleManualSubmit = () => {
    if (!amount) return;
    toast.success(`Manual Amount: ${amount}`);
    setAmount('');
  };

  return (
    <div className='flex flex-col h-full bg-muted/20 md:items-center md:justify-center md:p-4'>
      <div className='w-full flex-1 md:flex-none md:max-w-sm md:aspect-square md:rounded-xl overflow-hidden md:shadow-lg md:border bg-black relative'>
        <Scanner
          onScan={handleScan}
          scanDelay={500}
          styles={{ container: { height: '100%' } }}
        />
      </div>
      <p className='mt-4 text-center text-sm text-muted-foreground'>
        STABLE PAY QR Code | Address QR Code
      </p>

      <div className='mt-8 flex justify-center pb-8'>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant='outline'>Enter Amount Manually</Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className='mx-auto w-full max-w-sm'>
              <DrawerHeader>
                <DrawerTitle>Enter Amount</DrawerTitle>
              </DrawerHeader>
              <div className='p-4 pb-0'>
                <div className='flex items-center justify-center space-x-2'>
                  <Label htmlFor='amount' className='sr-only'>
                    Amount
                  </Label>
                  <Input
                    id='amount'
                    placeholder='0.00'
                    type='number'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button onClick={handleManualSubmit}>Submit</Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
