"use client";

import { useActionState } from "react";

import { updateFriendProfile, type FriendProfileActionState } from "@/features/friend-profiles/actions";
import { ActionSuccessToast } from "@/components/ui/action-success-toast";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";
import styles from "./friend-profile-form.module.css";

const initialState: FriendProfileActionState = {};

type FriendProfileFormProps = {
  roomCode: string;
  roomId: string;
  values: {
    bio: string | null;
    facebookUrl: string | null;
    lineId: string | null;
    instagramUrl: string | null;
    phone: string | null;
  };
};

/** ฟอร์มข้อมูลแนะนำตัวและช่องทางติดต่อของเพื่อน */
export function FriendProfileForm({ roomCode, roomId, values }: FriendProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateFriendProfile, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <input name="roomId" type="hidden" value={roomId} />
      <input name="roomCode" type="hidden" value={roomCode} />
      <label className={formStyles.label} htmlFor="friend-bio">แนะนำตัว</label>
      <textarea className={formStyles.control} defaultValue={values.bio ?? ""} id="friend-bio" maxLength={500} name="bio" placeholder="เล่าเรื่องสั้นๆ เกี่ยวกับตัวเอง" rows={3} />
      <FieldErrors id="friend-bio-errors" messages={state.fieldErrors?.bio} />
      <div className={styles.grid}>
        <label className={formStyles.label} htmlFor="friend-facebook">Facebook</label>
        <input className={formStyles.control} defaultValue={values.facebookUrl ?? ""} id="friend-facebook" name="facebookUrl" placeholder="https://facebook.com/..." type="url" />
        <FieldErrors id="friend-facebook-errors" messages={state.fieldErrors?.facebookUrl} />
        <label className={formStyles.label} htmlFor="friend-line">Line ID</label>
        <input className={formStyles.control} defaultValue={values.lineId ?? ""} id="friend-line" name="lineId" placeholder="เช่น together_01" />
        <FieldErrors id="friend-line-errors" messages={state.fieldErrors?.lineId} />
        <label className={formStyles.label} htmlFor="friend-instagram">Instagram</label>
        <input className={formStyles.control} defaultValue={values.instagramUrl ?? ""} id="friend-instagram" name="instagramUrl" placeholder="https://instagram.com/..." type="url" />
        <FieldErrors id="friend-instagram-errors" messages={state.fieldErrors?.instagramUrl} />
        <label className={formStyles.label} htmlFor="friend-phone">Phone</label>
        <input className={formStyles.control} defaultValue={values.phone ?? ""} id="friend-phone" name="phone" placeholder="08x-xxx-xxxx" type="tel" />
        <FieldErrors id="friend-phone-errors" messages={state.fieldErrors?.phone} />
      </div>
      {state.error ? <p className={formStyles.serviceError} role="alert">{state.error}</p> : null}
      <Button pending={isPending} pendingText="กำลังบันทึก…" type="submit" variant="primary">บันทึกโปรไฟล์เพื่อน</Button>
      <ActionSuccessToast message="บันทึกโปรไฟล์เพื่อนแล้ว" signal={state} success={state.success} />
    </form>
  );
}
