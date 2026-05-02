'use client';
import { Suspense } from 'react';                          // ✅ Suspense from react
import { useSearchParams } from 'next/navigation';          // ✅ useSearchParams from next/navigation
import ReceptionistNotificationSetting from '@/components/ReceptionistNotificationSetting';

function Inner() {
  const params = useSearchParams();
  const showMenu = params.get('showMenu') === 'true';
  return <ReceptionistNotificationSetting showMenu={showMenu} />;
}

export default function ReceptionistNotificationSettingRoute() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}