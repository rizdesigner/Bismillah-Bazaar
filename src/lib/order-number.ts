export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';

export async function generateOrderNumber(): Promise<string> {
  const supabase = await createClient();

  const { data: latestOrder } = await supabase
    .from('orders')
    .select('order_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1001;

  if (latestOrder?.order_number) {
    const match = latestOrder.order_number.match(/ORD-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `ORD-${nextNumber}`;
}
