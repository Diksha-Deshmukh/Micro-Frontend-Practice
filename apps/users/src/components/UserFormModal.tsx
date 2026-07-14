import {
  ApiError,
  Button,
  Field,
  Modal,
  SelectField,
  type AppUser,
  type UserInput,
  type UserRole,
  type UserStatus
} from "@mfe/shared";
import { useEffect, useState, type FormEvent } from "react";

interface UserFormModalProps {
  user?: AppUser;
  onClose: () => void;
  onSave: (input: UserInput) => Promise<void>;
}

type FormErrors = Partial<Record<keyof UserInput, string>>;

const emptyUser: UserInput = {
  name: "",
  email: "",
  role: "Viewer",
  status: "Invited"
};

function toInput(user?: AppUser): UserInput {
  if (!user) return emptyUser;

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

function validate(input: UserInput): FormErrors {
  const errors: FormErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();

  if (!name) errors.name = "Enter a name.";
  else if (name.length > 100) errors.name = "Use 100 characters or fewer.";

  if (!email) errors.email = "Enter an email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";

  return errors;
}

function serverFieldError(error: ApiError, field: keyof UserInput): string | undefined {
  const match = Object.entries(error.validationErrors).find(
    ([name]) => name.toLocaleLowerCase() === field.toLocaleLowerCase()
  );

  return match?.[1]?.[0];
}

export function UserFormModal({ onClose, onSave, user }: UserFormModalProps) {
  const [input, setInput] = useState<UserInput>(() => toInput(user));
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(user);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSaving, onClose]);

  function update<K extends keyof UserInput>(field: K, value: UserInput[K]) {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors = validate(input);

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsSaving(true);
    setFormError(undefined);

    try {
      await onSave({
        ...input,
        name: input.name.trim(),
        email: input.email.trim()
      });
      onClose();
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setErrors({
          name: serverFieldError(caughtError, "name"),
          email: serverFieldError(caughtError, "email")
        });
        setFormError(caughtError.message);
      } else {
        setFormError(caughtError instanceof Error ? caughtError.message : "The user could not be saved.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal onClose={isSaving ? () => undefined : onClose} title={isEditing ? "Edit team member" : "Add team member"}>
      <form onSubmit={handleSubmit}>
        <div className="modal__body">
          <p className="mfe-users-form-intro">
            {isEditing
              ? "Update access and account details for this team member."
              : "Create an account and choose the member's initial access level."}
          </p>
          {formError ? <div aria-live="polite" className="notice notice--error">{formError}</div> : null}
          <div className="form-grid">
            <div className="form-grid__wide">
              <Field
                autoComplete="name"
                autoFocus
                error={errors.name}
                label="Full name"
                maxLength={100}
                name="name"
                onChange={(event) => update("name", event.target.value)}
                placeholder="e.g. Diksha Deshmukh"
                value={input.name}
              />
            </div>
            <div className="form-grid__wide">
              <Field
                autoComplete="email"
                error={errors.email}
                label="Email address"
                name="email"
                onChange={(event) => update("email", event.target.value)}
                placeholder="alex@company.com"
                type="email"
                value={input.email}
              />
            </div>
            <SelectField
              label="Role"
              name="role"
              onChange={(event) => update("role", event.target.value as UserRole)}
              value={input.role}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Viewer">Viewer</option>
            </SelectField>
            <SelectField
              label="Status"
              name="status"
              onChange={(event) => update("status", event.target.value as UserStatus)}
              value={input.status}
            >
              <option value="Active">Active</option>
              <option value="Invited">Invited</option>
              <option value="Suspended">Suspended</option>
            </SelectField>
          </div>
        </div>
        <footer className="modal__footer">
          <Button disabled={isSaving} onClick={onClose} type="button" variant="secondary">Cancel</Button>
          <Button disabled={isSaving} type="submit">
            {isSaving ? "Saving…" : isEditing ? "Save changes" : "Add member"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
