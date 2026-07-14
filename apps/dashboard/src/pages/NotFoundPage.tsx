import { Button, Card, EmptyState, PageHeader } from "@mfe/shared";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <PageHeader
        eyebrow="404"
        subtitle="The requested address does not match a page in this workspace."
        title="Page not found"
      />
      <Card>
        <EmptyState
          action={
            <Button icon="dashboard" onClick={() => navigate("/")}>
              Back to overview
            </Button>
          }
          description="Check the address, or return to the dashboard to continue."
          icon="search"
          title="We could not find that page"
        />
      </Card>
    </div>
  );
}
