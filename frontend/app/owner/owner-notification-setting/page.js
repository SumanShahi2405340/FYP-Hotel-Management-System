'use client';
import { useSearchParams } from 'next/navigation';
import OwnerNotificationSetting from '@/components/OwnerNotificationSetting';

export default function NotificationSettingRoute() {
  const params = useSearchParams();
  const showMenu = params.get('sidebar') === 'true'; // reads ?sidebar=true

  return <OwnerNotificationSetting showMenu={showMenu} />;
}
