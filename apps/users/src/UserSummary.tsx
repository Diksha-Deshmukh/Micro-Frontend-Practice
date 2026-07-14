import {
  Card,
  ErrorState,
  Icon,
  LoadingBlock,
  type UserSummary as UserSummaryContract
} from "@mfe/shared";
import { useEffect, useState } from "react";
import { getUserSummary } from "./api/usersApi";
import "@mfe/shared/styles.css";
import "./users.css";

export interface UserSummaryProps {
  className?: string;
  compact?: boolean;
  refreshKey?: number;
}

export function UserSummary({ className = "", compact = false, refreshKey = 0 }: UserSummaryProps) {
  const [summary, setSummary] = useState<UserSummaryContract>();
  const [error, setError] = useState<Error>();
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(undefined);

    void getUserSummary(controller.signal)
      .then(setSummary)
      .catch((caughtError: unknown) => {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        setError(caughtError instanceof Error ? caughtError : new Error("Unable to load the user summary."));
      });

    return () => controller.abort();
  }, [refreshKey, retryKey]);

  if (!summary && error) {
    return (
      <Card className={`mfe-users-summary-error ${className}`.trim()}>
        <ErrorState onRetry={() => setRetryKey((current) => current + 1)} title="User summary unavailable" />
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className={`mfe-users-summary-loading ${className}`.trim()}>
        <LoadingBlock label="Loading user summary" />
      </Card>
    );
  }

  const mostCommonRole = summary.roles[0];

  return (
    <section
      aria-label="User overview"
      className={`mfe-users-summary ${compact ? "mfe-users-summary--compact" : ""} ${className}`.trim()}
    >
      <Card className="mfe-users-stat">
        <span className="mfe-users-stat__icon mfe-users-stat__icon--primary"><Icon name="users" /></span>
        <div><strong>{summary.total}</strong><span>Total members</span></div>
      </Card>
      <Card className="mfe-users-stat">
        <span className="mfe-users-stat__icon mfe-users-stat__icon--success"><Icon name="check" /></span>
        <div><strong>{summary.active}</strong><span>Active members</span></div>
      </Card>
      <Card className="mfe-users-stat">
        <span className="mfe-users-stat__icon mfe-users-stat__icon--warning"><Icon name="plus" /></span>
        <div><strong>{summary.pendingInvites}</strong><span>Pending invites</span></div>
      </Card>
      {!compact ? (
        <>
          <Card className="mfe-users-stat">
            <span className="mfe-users-stat__icon mfe-users-stat__icon--info"><Icon name="menu" /></span>
            <div>
              <strong>{mostCommonRole?.name ?? "—"}</strong>
              <span>{mostCommonRole ? `${mostCommonRole.count} in top role` : "No roles assigned"}</span>
            </div>
          </Card>
          <Card className="mfe-users-role-mix">
            <span>Role distribution</span>
            <div>
              {summary.roles.map((role) => (
                <span className="mfe-users-role-mix__item" key={role.name}>
                  {role.name}<strong>{role.count}</strong>
                </span>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </section>
  );
}

export default UserSummary;
