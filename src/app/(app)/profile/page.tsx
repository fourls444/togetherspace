import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/app/(app)/profile/profile-form";
import styles from "@/app/(app)/profile/profile.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { requireAppUser } from "@/lib/rooms/sidebar";

/** หน้าแก้ไขโปรไฟล์ — ชื่อที่แสดง, ชื่อผู้ใช้, รูปโปรไฟล์ */
export default async function ProfilePage() {
  const { supabase, userId } = await requireAppUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !profile) redirect("/dashboard");

  return (
    <PageShell>
      <div className={styles.container}>
        <Link className={styles.backLink} href="/dashboard">
          ← กลับไปหน้าหลัก
        </Link>
        <Panel className={styles.panel}>
          <div className={styles.intro}>
            <h1 className={styles.title}>แก้ไขโปรไฟล์</h1>
            <p className={styles.sub}>@{profile.username}</p>
          </div>
          <ProfileForm
            defaultValues={{
              displayName: profile.display_name,
              username: profile.username,
              avatarUrl: profile.avatar_url,
            }}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
