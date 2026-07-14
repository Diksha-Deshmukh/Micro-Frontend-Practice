import {
  ApiError,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  LoadingBlock,
  Modal,
  PageHeader,
  SearchInput,
  SelectField,
  type AppUser,
  type UserInput,
  type UserRole,
  type UserStatus
} from "@mfe/shared";
import { useEffect, useState } from "react";
import { createUser, deleteUser, updateUser } from "./api/usersApi";
import { UserFormModal } from "./components/UserFormModal";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useUsers } from "./hooks/useUsers";
import { UserSummary } from "./UserSummary";
import "@mfe/shared/styles.css";
import "./users.css";

interface Notice {
  tone: "success" | "error";
  message: string;
}

function statusTone(status: UserStatus): "success" | "warning" | "danger" {
  if (status === "Active") return "success";
  if (status === "Invited") return "warning";
  return "danger";
}

function roleTone(role: UserRole): "info" | "neutral" | "warning" {
  if (role === "Admin") return "info";
  if (role === "Manager") return "warning";
  return "neutral";
}

function lastActiveLabel(value: string | null): { label: string; title?: string } {
  if (!value) return { label: "Not yet active" };

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return { label: "Unknown" };

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.valueOf()) / 60_000));
  const title = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);

  if (elapsedMinutes < 1) return { label: "Just now", title };
  if (elapsedMinutes < 60) return { label: `${elapsedMinutes}m ago`, title };

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return { label: `${elapsedHours}h ago`, title };

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return { label: `${elapsedDays}d ago`, title };

  return { label: title, title };
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return fallback;
}

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser>();
  const [deleteTarget, setDeleteTarget] = useState<AppUser>();
  const [deleteError, setDeleteError] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search, 250);

  const { error, isInitialLoading, isRefreshing, refresh, users } = useUsers({
    search: debouncedSearch || undefined,
    role: role || undefined,
    status: status || undefined
  });

  const filtersAreActive = Boolean(search || role || status);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(undefined), 5_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!deleteTarget) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) setDeleteTarget(undefined);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [deleteTarget, isDeleting]);

  function clearFilters() {
    setSearch("");
    setRole("");
    setStatus("");
  }

  function closeForm() {
    setIsAdding(false);
    setEditingUser(undefined);
  }

  async function saveUser(input: UserInput) {
    const wasEditing = Boolean(editingUser);

    if (editingUser) await updateUser(editingUser.id, input);
    else await createUser(input);

    await refresh();
    setSummaryRefreshKey((current) => current + 1);
    setNotice({
      tone: "success",
      message: wasEditing ? `${input.name} was updated.` : `${input.name} was added to the team.`
    });
  }

  function requestDelete(user: AppUser) {
    setDeleteError(undefined);
    setDeleteTarget(user);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(undefined);

    try {
      await deleteUser(deleteTarget.id);
      const deletedName = deleteTarget.name;
      setDeleteTarget(undefined);
      await refresh();
      setSummaryRefreshKey((current) => current + 1);
      setNotice({ tone: "success", message: `${deletedName} was removed.` });
    } catch (caughtError) {
      setDeleteError(errorMessage(caughtError, "The team member could not be removed."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="mfe-users-page">
      <PageHeader
        actions={
          <>
            <Button disabled={isRefreshing} icon="refresh" onClick={() => void refresh()} variant="secondary">
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button icon="plus" onClick={() => setIsAdding(true)}>Add member</Button>
          </>
        }
        eyebrow="Identity & access"
        subtitle="Invite teammates, assign roles, and keep access aligned with your organization."
        title="Users"
      />

      {notice ? (
        <div aria-live="polite" className={`notice notice--${notice.tone} mfe-users-notice`} role="status">
          <Icon name={notice.tone === "success" ? "check" : "close"} />
          <span>{notice.message}</span>
          <IconButton icon="close" label="Dismiss notification" onClick={() => setNotice(undefined)} />
        </div>
      ) : null}

      <UserSummary refreshKey={summaryRefreshKey} />

      <Card className="data-card mfe-users-directory">
        <div className="toolbar mfe-users-toolbar">
          <SearchInput onChange={setSearch} placeholder="Search by name or email" value={search} />
          <SelectField
            label="Filter by role"
            onChange={(event) => setRole(event.target.value as UserRole | "")}
            value={role}
          >
            <option value="">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Viewer">Viewer</option>
          </SelectField>
          <SelectField
            label="Filter by status"
            onChange={(event) => setStatus(event.target.value as UserStatus | "")}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Invited">Invited</option>
            <option value="Suspended">Suspended</option>
          </SelectField>
          {filtersAreActive ? <Button onClick={clearFilters} variant="ghost">Clear filters</Button> : null}
          <span aria-live="polite" className="mfe-users-result-count">
            {users.length} {users.length === 1 ? "member" : "members"}
          </span>
        </div>

        {isInitialLoading ? <LoadingBlock label="Loading team members" /> : null}

        {!isInitialLoading && error && users.length > 0 ? (
          <div className="notice notice--error mfe-users-directory__notice" role="alert">
            {error.message}
          </div>
        ) : null}

        {!isInitialLoading && error && users.length === 0 ? (
          <ErrorState onRetry={() => void refresh()} title="Team directory unavailable" />
        ) : null}

        {!isInitialLoading && !error && users.length === 0 ? (
          <EmptyState
            action={
              filtersAreActive
                ? <Button onClick={clearFilters} variant="secondary">Clear filters</Button>
                : <Button icon="plus" onClick={() => setIsAdding(true)}>Add first member</Button>
            }
            description={
              filtersAreActive
                ? "No team members match the current search and filters."
                : "Add a teammate to start managing access from one place."
            }
            icon="users"
            title={filtersAreActive ? "No matching members" : "Your team is ready to grow"}
          />
        ) : null}

        {!isInitialLoading && users.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table mfe-users-table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last active</th>
                  <th className="mfe-users-actions-heading" scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const lastActive = lastActiveLabel(user.lastActiveAt);

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="table-primary">
                          <Avatar name={user.name} />
                          <div>
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td><Badge tone={roleTone(user.role)}>{user.role}</Badge></td>
                      <td><Badge tone={statusTone(user.status)}>{user.status}</Badge></td>
                      <td>
                        {user.lastActiveAt ? (
                          <time className="mfe-users-last-active" dateTime={user.lastActiveAt} title={lastActive.title}>
                            {lastActive.label}
                          </time>
                        ) : <span className="muted">{lastActive.label}</span>}
                      </td>
                      <td>
                        <div className="row-actions">
                          <IconButton icon="edit" label={`Edit ${user.name}`} onClick={() => setEditingUser(user)} />
                          <IconButton icon="trash" label={`Delete ${user.name}`} onClick={() => requestDelete(user)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      {isAdding || editingUser ? (
        <UserFormModal
          key={editingUser?.id ?? "new-user"}
          onClose={closeForm}
          onSave={saveUser}
          user={editingUser}
        />
      ) : null}

      {deleteTarget ? (
        <Modal onClose={isDeleting ? () => undefined : () => setDeleteTarget(undefined)} title="Remove team member?">
          <div className="modal__body">
            <div className="mfe-users-delete-copy">
              <Avatar name={deleteTarget.name} />
              <div>
                <strong>{deleteTarget.name}</strong>
                <span>{deleteTarget.email}</span>
              </div>
            </div>
            <p className="mfe-users-delete-warning">
              This permanently removes the account from this demo. This action cannot be undone.
            </p>
            {deleteError ? <div className="notice notice--error" role="alert">{deleteError}</div> : null}
          </div>
          <footer className="modal__footer">
            <Button disabled={isDeleting} onClick={() => setDeleteTarget(undefined)} variant="secondary">Cancel</Button>
            <Button disabled={isDeleting} onClick={() => void confirmDelete()} variant="danger">
              {isDeleting ? "Removing…" : "Remove member"}
            </Button>
          </footer>
        </Modal>
      ) : null}
    </section>
  );
}

export default UsersPage;
