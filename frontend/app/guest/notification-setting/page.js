'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GuestNotificationSetting from '@/components/GuestNotificationSetting';

function NotificationPageContent() {
  const params = useSearchParams();

  const showMenu =
    params.get('sidebar') === 'true' ||
    params.get('menu') === 'true';

  return <GuestNotificationSetting showMenu={showMenu} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NotificationPageContent />
    </Suspense>
  );
}