import {
  Component,
  type ButtonHTMLAttributes,
  type ErrorInfo,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
  type SelectHTMLAttributes
} from "react";
import { Icon, type IconName } from "./icons";

export function Button({
  children,
  icon,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: IconName; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button className={`button button--${variant}`} {...props}>
      {icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ label, icon, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: IconName }) {
  return (
    <button aria-label={label} className="icon-button" title={label} {...props}>
      <Icon name={icon} />
    </button>
  );
}

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "success" | "warning" | "danger" | "info" }>) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function PageHeader({
  actions,
  eyebrow,
  subtitle,
  title
}: {
  actions?: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function Field({
  error,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string; label: string }) {
  const id = props.id ?? props.name;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} id={id} {...props} />
      {error ? <small className="field__error" id={`${id}-error`}>{error}</small> : null}
    </label>
  );
}

export function SelectField({
  children,
  error,
  label,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: string; label: string }) {
  const id = props.id ?? props.name;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select aria-invalid={Boolean(error)} id={id} {...props}>{children}</select>
      {error ? <small className="field__error">{error}</small> : null}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="search-input">
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" />
      <input onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" value={value} />
    </label>
  );
}

export function EmptyState({ action, description, icon = "box", title }: { action?: ReactNode; description: string; icon?: IconName; title: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><Icon name={icon} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ onRetry, title = "Something went wrong" }: { onRetry?: () => void; title?: string }) {
  return (
    <div className="empty-state empty-state--error" role="alert">
      <h3>{title}</h3>
      <p>This part of the page could not load. The rest of the application is still available.</p>
      {onRetry ? <Button onClick={onRetry} variant="secondary">Try again</Button> : null}
    </div>
  );
}

export function LoadingBlock({ label = "Loading content" }: { label?: string }) {
  return (
    <div aria-label={label} className="loading-block" role="status">
      <span className="skeleton skeleton--title" />
      <span className="skeleton" />
      <span className="skeleton" />
    </div>
  );
}

export function Modal({ children, onClose, title }: PropsWithChildren<{ onClose: () => void; title: string }>) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section aria-labelledby="modal-title" aria-modal="true" className="modal" role="dialog">
        <header className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <IconButton icon="close" label="Close dialog" onClick={onClose} />
        </header>
        {children}
      </section>
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const hue = [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;
  return <span aria-hidden="true" className="avatar" style={{ "--avatar-hue": hue } as React.CSSProperties}>{initials}</span>;
}

interface BoundaryProps extends PropsWithChildren {
  fallback?: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

export class RemoteErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("A federated module failed to render.", error, info);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? <ErrorState />;
    return this.props.children;
  }
}

