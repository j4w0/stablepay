import { Card, CardContent, CardHeader, CardTitle } from '@stablepay/ui-base';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Building2, CreditCard, List, Plus } from 'lucide-react';

export const Route = createFileRoute('/')({ component: App });

function App() {
  const actions = [
    {
      title: 'Create Merchant',
      description: 'Register a new merchant entity.',
      href: '/merchants/new',
      icon: Plus,
    },
    {
      title: 'View Merchants',
      description: 'View all registered merchants.',
      href: '/merchants',
      icon: Building2,
    },
    {
      title: 'Create Payment',
      description: 'Generate a payment request.',
      href: '/payments/new',
      icon: CreditCard,
    },
    {
      title: 'View Payments',
      description: 'Inspect and manage payment records.',
      href: '/payments',
      icon: List,
    },
  ];

  return (
    <div className='p-8 space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Manage your merchant settings and payments.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className='block transition-all hover:scale-105'
          >
            <Card className='h-full hover:bg-muted/50 transition-colors'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {action.title}
                </CardTitle>
                <action.icon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-xs text-muted-foreground'>
                  {action.description}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
