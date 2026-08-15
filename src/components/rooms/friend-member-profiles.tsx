"use client";

import { AtSign, Link2, MessageCircle, Phone, X } from "lucide-react";
import { useState, useTransition } from "react";

import { FriendProfileForm } from "@/components/rooms/friend-profile-form";
import { RoomProfileForm } from "@/components/rooms/room-profile-form";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Toast } from "@/components/ui/toast";
import { changeMemberRole, kickMember } from "@/features/members/actions";
import { ROOM_ROLE_LABEL } from "@/lib/rooms/labels";
import type { RoomRole } from "@/lib/types/database";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";
import type { MemberListItem } from "@/components/rooms/member-list";
import styles from "./friend-member-profiles.module.css";

type Profile = {
  user_id: string;
  bio: string | null;
  facebook_url: string | null;
  line_id: string | null;
  instagram_url: string | null;
  phone: string | null;
};

type Props = {
  currentUserId: string;
  members: MemberListItem[];
  profiles: Profile[];
  roomCode: string;
  roomId: string;
  canManage: boolean;
};

/** รวมการดูและแก้ไขโปรไฟล์เพื่อนไว้ในหน้าสมาชิก โดยไม่ต้องเปลี่ยนหน้า */
export function FriendMemberProfiles({ currentUserId, members, profiles, roomCode, roomId, canManage }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kickTarget, setKickTarget] = useState<MemberListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selected = members.find((member) => member.userId === selectedId) ?? null;
  const selectedProfile = profiles.find((profile) => profile.user_id === selectedId);
  const isSelf = selected?.userId === currentUserId;

  const updateRole = (userId: string, role: RoomRole) => startTransition(async () => {
    const result = await changeMemberRole(roomId, userId, role, roomCode);
    setToast(result.error ?? "เปลี่ยนบทบาทสมาชิกแล้ว");
  });

  const removeMember = () => {
    if (!kickTarget) return;
    startTransition(async () => {
      const result = await kickMember(roomId, kickTarget.userId, roomCode);
      setToast(result.error ?? `นำ ${kickTarget.displayName} ออกจากห้องแล้ว`);
      setKickTarget(null);
    });
  };

  return (
    <section className={styles.section} aria-labelledby="friend-profiles-title">
      <div className={styles.heading}>
        <div>
          <h3 id="friend-profiles-title">โปรไฟล์เพื่อน</h3>
          <p>กดที่สมาชิกเพื่อดูรายละเอียด และกดโปรไฟล์ของตัวเองเพื่อแก้ไขข้อมูลเพิ่มเติม</p>
        </div>
      </div>
      <div className={styles.grid}>
        {members.map((member) => {
          const profile = profiles.find((item) => item.user_id === member.userId);
          return (
            <div className={styles.card} key={member.userId}>
              <button className={styles.cardButton} onClick={() => setSelectedId(member.userId)} type="button">
              <img src={member.avatarUrl || getDefaultImageUrl("profile")} alt="" />
              <span className={styles.cardCopy}>
                <strong>{member.displayName}</strong>
                <span>@{member.username}</span>
                <small>{profile?.bio || (member.userId === currentUserId ? "เพิ่มข้อมูลแนะนำตัวของคุณ" : "ดูโปรไฟล์และช่องทางติดต่อ")}</small>
              </span>
              </button>
              {canManage && member.userId !== currentUserId ? (
                <div className={styles.memberActions}>
                  <select aria-label={`บทบาทของ ${member.displayName}`} disabled={isPending} onChange={(event) => updateRole(member.userId, event.target.value as RoomRole)} value={member.role}>
                    <option value="member">{ROOM_ROLE_LABEL.member}</option>
                    <option value="owner">{ROOM_ROLE_LABEL.owner}</option>
                  </select>
                  <Button disabled={isPending} onClick={() => setKickTarget(member)} type="button" variant="danger">ลบออก</Button>
                </div>
              ) : <span className={styles.role}>{ROOM_ROLE_LABEL[member.role]}{member.userId === currentUserId ? " (คุณ)" : ""}</span>}
            </div>
          );
        })}
      </div>

      {selected ? (
        <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
          <div aria-modal="true" className={styles.modal} role="dialog" aria-labelledby="member-profile-title">
            <button aria-label="ปิด" className={styles.close} onClick={() => setSelectedId(null)} type="button"><X size={18} /></button>
            {isSelf ? (
              <>
                <div className={styles.modalHeading}><h3 id="member-profile-title">แก้ไขโปรไฟล์ในห้อง</h3><p>ข้อมูลนี้จะแสดงให้สมาชิกในห้องเห็น</p></div>
                <RoomProfileForm
                  defaultValues={{ avatarUrl: selected.avatarUrl, displayName: selected.displayName }}
                  mainDisplayName={selected.displayName}
                  roomCode={roomCode}
                  roomId={roomId}
                />
                <FriendProfileForm
                  roomCode={roomCode}
                  roomId={roomId}
                  values={{
                    bio: selectedProfile?.bio ?? null,
                    facebookUrl: selectedProfile?.facebook_url ?? null,
                    lineId: selectedProfile?.line_id ?? null,
                    instagramUrl: selectedProfile?.instagram_url ?? null,
                    phone: selectedProfile?.phone ?? null,
                  }}
                />
              </>
            ) : (
              <>
                <div className={styles.profileHero}>
                  <img src={selected.avatarUrl || getDefaultImageUrl("profile")} alt="" />
                  <div><p className={styles.eyebrow}>โปรไฟล์เพื่อน</p><h3 id="member-profile-title">{selected.displayName}</h3><p>@{selected.username}</p></div>
                </div>
                <p className={styles.bio}>{selectedProfile?.bio || "ยังไม่มีคำแนะนำตัวเพิ่มเติม"}</p>
                <div className={styles.contacts}>
                  {selectedProfile?.facebook_url ? <a href={selectedProfile.facebook_url} target="_blank" rel="noreferrer"><Link2 size={16} /> Facebook</a> : null}
                  {selectedProfile?.instagram_url ? <a href={selectedProfile.instagram_url} target="_blank" rel="noreferrer"><AtSign size={16} /> Instagram</a> : null}
                  {selectedProfile?.line_id ? <span><MessageCircle size={16} /> Line: {selectedProfile.line_id}</span> : null}
                  {selectedProfile?.phone ? <a href={`tel:${selectedProfile.phone}`}><Phone size={16} /> {selectedProfile.phone}</a> : null}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      <ConfirmationDialog confirmLabel="นำออกจากห้อง" description={kickTarget ? `${kickTarget.displayName} จะไม่สามารถเข้าถึงข้อมูลในห้องนี้ได้จนกว่าจะเข้าร่วมใหม่` : ""} isPending={isPending} onCancel={() => setKickTarget(null)} onConfirm={removeMember} open={Boolean(kickTarget)} title="นำสมาชิกออกจากห้อง?" variant="danger" />
      <Toast message={toast} onDismiss={() => setToast(null)} tone="success" />
    </section>
  );
}
