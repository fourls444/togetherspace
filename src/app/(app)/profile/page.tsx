import { redirect } from "next/navigation";

import { ProfileForm } from "@/app/(app)/profile/profile-form";
import styles from "@/app/(app)/profile/profile.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { GlowCard } from "@/components/ui/glow-card";
import { requireAppUser } from "@/lib/rooms/sidebar";

export default async function ProfilePage() {
  const { supabase, userId } = await requireAppUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !profile) redirect("/dashboard");

  return (
    <div className={styles.wrap}>
      <ButtonLink className={styles.backButton} href="/dashboard">
        ← กลับหน้าแรก
      </ButtonLink>
      <GlowCard contentClassName={styles.panel} tone="room" animated>
        <div className={styles.intro}>
          <h1 className={styles.title}>โปรไฟล์ของคุณ</h1>
          <p className={styles.sub}>@{profile.username}</p>
        </div>
        <ProfileForm
          defaultValues={{
            displayName: profile.display_name,
            username: profile.username,
            avatarUrl: profile.avatar_url,
          }}
        />
      </GlowCard>
    </div>
  );
}
