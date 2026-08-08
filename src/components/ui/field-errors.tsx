import styles from "@/components/ui/form.module.css";

type FieldErrorsProps = {
  id?: string;
  messages?: string[];
};

export function FieldErrors({ id, messages }: FieldErrorsProps) {
  if (!messages?.length) return null;

  return (
    <div className={styles.errors} id={id} role="alert">
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
