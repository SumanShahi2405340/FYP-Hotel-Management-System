'use client';
import { useSearchParams } from 'next/navigation';
import NotificationSetting from '@/components/NotificationSetting';

export default function NotificationSettingRoute() {
  const params = useSearchParams();
  const showMenu = params.get('sidebar') === 'true'; // reads ?sidebar=true

  return <NotificationSetting showMenu={showMenu} />;
}
