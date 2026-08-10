import { redirect } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { InvitePreview } from "@/components/rooms/invite-preview";
import { ButtonLink } from "@/components/ui/button-link";
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

  const { data: previewRows, error } = await supabase.rpc("preview_room_invite", {
    p_invite_token: code,
  });
  const preview = previewRows?.[0];

  if (error || !preview) {
    const message = error?.message ?? "";
    const title = message.includes("revoked")
      ? "คำเชิญถูกยกเลิก"
      : message.includes("expired")
        ? "คำเชิญหมดอายุ"
        : message.includes("limit reached")
          ? "คำเชิญถูกใช้งานครบแล้ว"
          : "ไม่พบคำเชิญ";
    const description = message.includes("revoked")
      ? "คำเชิญนี้ถูกผู้ดูแลห้องยกเลิกแล้ว"
      : message.includes("expired")
        ? "ลิงก์คำเชิญนี้หมดอายุแล้ว"
        : message.includes("limit reached")
          ? "คำเชิญนี้ถูกใช้งานครบตามจำนวนครั้งที่กำหนดแล้ว"
          : "ไม่พบคำเชิญนี้ หรือลิงก์คำเชิญไม่ถูกต้อง";

    return (
      <PageShell>
        <ErrorState
          description={description}
          headingLevel={1}
          title={title}
        />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          <ButtonLink href="/dashboard">กลับไปหน้าหลัก</ButtonLink>
        </p>
      </PageShell>
    );
  }

  const roomCodeResult = preview.is_already_member
    ? await supabase
        .from("rooms")
        .select("room_code")
        .eq("id", preview.room_id)
        .maybeSingle()
    : { data: null };

  return (
    <PageShell>
      <InvitePreview
        codeOrToken={code}
        isAlreadyMember={preview.is_already_member}
        room={{
          id: preview.room_id,
          name: preview.room_name,
          roomCode: roomCodeResult.data?.room_code ?? preview.room_id,
          type: preview.room_type,
          avatarUrl: preview.room_avatar_url,
          memberCount: preview.member_count,
        }}
      />
    </PageShell>
  );
}
