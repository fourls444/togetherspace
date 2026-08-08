import Link from "next/link";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { InvitePreview } from "@/components/rooms/invite-preview";
import { ErrorState } from "@/components/ui/error-state";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) redirect("/dashboard");

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const currentUserId = claimsData?.claims.sub;

  if (!currentUserId) {
    redirect(`/login?next=/invite/${code}`);
  }

  const { data: invite } = await supabase
    .from("room_invites")
    .select("id, room_id, expires_at, max_uses, uses_count, revoked_at")
    .or(`invite_code.eq.${code.toUpperCase()},invite_token.eq.${code}`)
    .maybeSingle();

  if (!invite) {
    return (
      <PageShell>
        <ErrorState
          description="ไม่พบคำเชิญนี้ หรือลิงก์คำเชิญไม่ถูกต้อง"
          headingLevel={1}
          title="ไม่พบคำเชิญ"
        />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/dashboard">← กลับไปหน้า Dashboard</Link>
        </p>
      </PageShell>
    );
  }

  if (invite.revoked_at) {
    return (
      <PageShell>
        <ErrorState
          description="คำเชิญนี้ถูกผู้ดูแลห้องยกเลิกแล้ว"
          headingLevel={1}
          title="คำเชิญถูกยกเลิก"
        />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/dashboard">← กลับไปหน้า Dashboard</Link>
        </p>
      </PageShell>
    );
  }

  if (invite.expires_at && new Date(invite.expires_at) <= new Date()) {
    return (
      <PageShell>
        <ErrorState
          description="ลิงก์คำเชิญนี้หมดอายุแล้ว"
          headingLevel={1}
          title="คำเชิญหมดอายุ"
        />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/dashboard">← กลับไปหน้า Dashboard</Link>
        </p>
      </PageShell>
    );
  }

  if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) {
    return (
      <PageShell>
        <ErrorState
          description="คำเชิญนี้ถูกใช้งานครบตามจำนวนครั้งที่กำหนดแล้ว"
          headingLevel={1}
          title="คำเชิญถูกใช้งานครบแล้ว"
        />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/dashboard">← กลับไปหน้า Dashboard</Link>
        </p>
      </PageShell>
    );
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, type, avatar_url")
    .eq("id", invite.room_id)
    .single();

  if (!room) {
    return (
      <PageShell>
        <ErrorState
          description="ห้องที่ถูกเชิญถูกลบไปแล้ว"
          headingLevel={1}
          title="ไม่พบห้อง"
        />
      </PageShell>
    );
  }

  const { data: existingMember } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", room.id)
    .eq("user_id", currentUserId)
    .maybeSingle();

  return (
    <PageShell>
      <InvitePreview
        codeOrToken={code}
        isAlreadyMember={Boolean(existingMember)}
        room={{
          id: room.id,
          name: room.name,
          type: room.type,
          avatarUrl: room.avatar_url,
        }}
      />
    </PageShell>
  );
}
