import { notFound, redirect } from "next/navigation";

import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

const MODULE_ALIASES: Record<string, string> = {
  family: "family-tree",
  invite: "settings#invite",
  member: "members",
  people: "members",
  share: "settings#invite",
  tree: "family-tree",
};

/** พาลิงก์เก่าหรือชื่อ route แบบสั้นไปยังหน้าโมดูลจริง เพื่อไม่ให้ผู้ใช้เจอ 404 */
export default async function RoomModuleAliasPage({
  params,
}: {
  params: Promise<{ module: string; roomId: string }>;
}) {
  const { module, roomId } = await params;
  const target = MODULE_ALIASES[module.toLowerCase()];
  if (!target) notFound();

  const context = await getRoomContext(roomId);
  if (!context.isMember) redirect("/dashboard");

  redirect(getRoomSubPath(context.roomCode, target));
}
