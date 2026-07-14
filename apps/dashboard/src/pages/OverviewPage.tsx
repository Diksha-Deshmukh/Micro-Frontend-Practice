import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingBlock,
  PageHeader,
  apiRequest,
  type ActivityItem,
  type IconName
} from "@mfe/shared";
import { useResource } from "../hooks/useResource";


function fetchActivity() {
  return apiRequest<ActivityItem[]>("/api/dashboard/activity");
}

function formatRelativeTime(value: string) {
  const differenceInMinutes = Math.round(
    (new Date(value).getTime() - Date.now()) / 60_000
  );
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (Math.abs(differenceInMinutes) < 60) {
    return formatter.format(differenceInMinutes, "minute");
  }

  const differenceInHours = Math.round(differenceInMinutes / 60);
  if (Math.abs(differenceInHours) < 24) {
    return formatter.format(differenceInHours, "hour");
  }

  return formatter.format(Math.round(differenceInHours / 24), "day");
}

const activityIcons: Record<ActivityItem["kind"], IconName> = {
  product: "box",
  system: "dashboard",
  user: "users"
};

export function OverviewPage() {
  const activity = useResource(fetchActivity);
  const isRefreshing = activity.status === "loading";
  const lastUpdated = activity.updatedAt;

  const refreshDashboard = () => {
    activity.retry();
  };

  return (
    <div className="overview-page">
      <PageHeader
        actions={
          <>
            <span aria-live="polite" className="last-updated">
              {isRefreshing
                ? "Refreshing data"
                : lastUpdated
                  ? "Updated " + lastUpdated.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Live workspace data"}
            </span>
            <Button
              disabled={isRefreshing}
              icon="refresh"
              onClick={refreshDashboard}
              variant="secondary"
            >
              Refresh
            </Button>
          </>
        }
        eyebrow="Dashboard"
        subtitle="Monitor inventory and team access across independently deployed micro frontends."
        title="Good morning, Diksha"
      />

      <section aria-labelledby="recent-activity-title" className="overview-section">
        <Card className="activity-card">
          <header className="activity-card__header">
            <div>
              <h2 id="recent-activity-title">Recent activity</h2>
              <p>Latest changes across products and team members.</p>
            </div>
            <Badge tone="neutral">Last 5 events</Badge>
          </header>

          {activity.status === "loading" ? (
            <LoadingBlock label="Loading recent activity" />
          ) : activity.status === "error" ? (
            <ErrorState
              onRetry={activity.retry}
              title="Recent activity is unavailable"
            />
          ) : activity.data?.length ? (
            <ol className="activity-list">
              {activity.data.map((item) => (
                <li key={item.id}>
                  <span
                    aria-hidden="true"
                    className={"activity-list__icon activity-list__icon--" + item.kind}
                  >
                    <Icon name={activityIcons[item.kind]} />
                  </span>
                  <span className="activity-list__content">
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <time
                    dateTime={item.occurredAt}
                    title={new Date(item.occurredAt).toLocaleString()}
                  >
                    {formatRelativeTime(item.occurredAt)}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              description="Product and user changes will appear here."
              icon="dashboard"
              title="No recent activity"
            />
          )}
        </Card>
      </section>
    </div>
  );
}
