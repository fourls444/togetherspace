import type { PropsWithChildren } from "react";

import { AppFrame } from "@/components/layout/app-frame";
import { getSidebarRooms, requireAppUser } from "@/lib/rooms/sidebar";

export const dynamic = "force-dynamic";

/** โครงแอปหลังล็อกอิน — sidebar + คลื่นคงอยู่ข้ามหน้า ไม่ remount ทุกคลิก */
export default async function AppLayout({ children }: PropsWithChildren) {
  await requireAppUser();
  const rooms = await getSidebarRooms();

  return <AppFrame rooms={rooms}>{children}</AppFrame>;
}
