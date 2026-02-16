'use client';

import { use } from 'react';
import OwnerDashboard from "@/components/OwnerDashboard";

export default function Page({ params }) {
  const { hotelId } = use(params);   //  unwrap the promise
  return <OwnerDashboard hotelId={hotelId} />;
}
