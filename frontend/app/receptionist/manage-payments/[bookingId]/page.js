import ManagePayments from '@/components/ManagePayments';

export default function ManagePaymentsPage({ params }) {
  const { bookingId } = params;  // Next.js provides params automatically
  return <ManagePayments bookingId={bookingId} />;
}
