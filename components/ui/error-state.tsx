import styles from "@/components/ui/error-state.module.css";

type ErrorStateProps = {
  title: string;
  description: string;
  headingLevel?: 1 | 2;
};

/** แสดงข้อผิดพลาดระดับ section พร้อมลำดับ heading ที่หน้ากำหนดได้ */
export function ErrorState({
  title,
  description,
  headingLevel = 2,
}: ErrorStateProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className={styles.error} role="alert">
      <Heading>{title}</Heading>
      <p>{description}</p>
    </section>
  );
}
