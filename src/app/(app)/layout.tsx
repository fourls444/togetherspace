import { Suspense, type PropsWithChildren } from "react";

import { AppFrame } from "@/components/layout/app-frame";
import { Sidebar } from "@/components/layout/sidebar";
import { getSidebarRooms } from "@/lib/rooms/sidebar";

/** โหลดรายการห้องแบบไม่บล็อกเปลือกแอป */
async function AppSidebar() {
  const rooms = await getSidebarRooms();
  return <Sidebar rooms={rooms} />;
}

/** โครงแอปหลังล็อกอิน — เปลือก sync, ข้อมูล sidebar สตรีมแยก */
export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <AppFrame
      sidebar={
        <Suspense fallback={<Sidebar rooms={[]} />}>
          <AppSidebar />
        </Suspense>
      }
    >
      {children}
    </AppFrame>
  );
}
