import type { PropsWithChildren } from "react";

import styles from "@/components/auth/auth-shell.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Panel } from "@/components/ui/panel";

type AuthShellProps = PropsWithChildren<{
  title: string;
  description: string;
  switchPrompt: string;
  switchHref: string;
  switchLabel: string;
}>;

export function AuthShell({
  children,
  title,
  description,
  switchPrompt,
  switchHref,
  switchLabel,
}: AuthShellProps) {
  return (
    <PageShell className={styles.shell}>
      <Panel className={styles.panel}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>TogetherSpace</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        {children}

        <div className={styles.switchAccount}>
          <p>{switchPrompt}</p>
          <ButtonLink href={switchHref}>{switchLabel}</ButtonLink>
        </div>
      </Panel>
    </PageShell>
  );
}
