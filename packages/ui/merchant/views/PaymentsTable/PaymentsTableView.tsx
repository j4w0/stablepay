import { PaymentStatus } from '@stablepay/common/interfaces/Payment';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stablepay/ui-base';
import { RefreshCw, Trash2 } from 'lucide-react';
import type { PaymentsTableViewProps } from './PaymentsTableInterface';

const statusOptions = [
  PaymentStatus.Pending,
  PaymentStatus.Processing,
  PaymentStatus.Completed,
  PaymentStatus.Failed,
  PaymentStatus.Expired,
];

export function PaymentsTableView({
  payments,
  isLoading,
  error,
  selectedRefs,
  currentPage,
  totalPages,
  onRefresh,
  onPageChange,
  onUpdateStatus,
  onDeletePayment,
  onToggleSelect,
  onToggleSelectAll,
  onBulkDelete,
}: PaymentsTableViewProps) {
  const allSelected =
    payments.length > 0 && selectedRefs.length === payments.length;
  const hasSelection = selectedRefs.length > 0;
  const hasPagination = payments.length > 0;

  const pageItems = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 'ellipsis', totalPages] as const;
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        'ellipsis',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ] as const;
    }

    return [
      1,
      'ellipsis',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis',
      totalPages,
    ] as const;
  })();
  if (error) {
    return (
      <div className='p-8'>
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='text-destructive'>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>{error}</p>
            <Button onClick={onRefresh} className='mt-4' variant='outline'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='p-8 space-y-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Payments</h1>
          <p className='text-muted-foreground'>
            Inspect and manage payment records
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button onClick={onRefresh} variant='outline' disabled={isLoading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            onClick={onBulkDelete}
            variant='destructive'
            disabled={!hasSelection}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Delete Selected
          </Button>
        </div>
      </div>

      {isLoading && payments.length === 0 ? (
        <div className='flex justify-center items-center py-12'>
          <Spinner className='h-8 w-8' />
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>No payments found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className='text-muted-foreground'>
                  <TableHead>
                    <input
                      type='checkbox'
                      checked={allSelected}
                      onChange={onToggleSelectAll}
                      role='checkbox'
                    />
                  </TableHead>
                  <TableHead>Payment Ref</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.paymentRef}>
                    <TableCell>
                      <input
                        type='checkbox'
                        checked={selectedRefs.includes(payment.paymentRef)}
                        onChange={() => onToggleSelect(payment.paymentRef)}
                        role='checkbox'
                      />
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {payment.paymentRef}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {payment.merchantId}
                    </TableCell>
                    <TableCell>
                      {payment.amount} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <select
                        className='rounded-md border bg-background px-2 py-1 text-xs'
                        value={payment.status}
                        onChange={(event) =>
                          onUpdateStatus(
                            payment.paymentRef,
                            (event.target as unknown as { value: string })
                              .value as PaymentStatus
                          )
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {payment.txHash ? payment.txHash : '-'}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {payment.updatedAt
                        ? new Date(payment.updatedAt).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => onDeletePayment(payment.paymentRef)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {hasPagination && (
              <div className='mt-4'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href='#'
                        size='default'
                        onClick={(event) => {
                          event.preventDefault();
                          if (currentPage > 1) {
                            onPageChange(currentPage - 1);
                          }
                        }}
                      />
                    </PaginationItem>
                    {pageItems.map((item, index) =>
                      item === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href='#'
                            size='icon'
                            isActive={item === currentPage}
                            onClick={(event) => {
                              event.preventDefault();
                              onPageChange(item);
                            }}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href='#'
                        size='default'
                        onClick={(event) => {
                          event.preventDefault();
                          if (currentPage < totalPages) {
                            onPageChange(currentPage + 1);
                          }
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className='mt-2 text-center text-xs text-muted-foreground'>
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
