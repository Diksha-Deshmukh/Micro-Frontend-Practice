import { useEffect, useState } from "react";
import { Avatar, Icon, IconButton, type IconName } from "@mfe/shared";
import { NavLink, Outlet, useLocation } from "react-router-dom";

interface NavigationItem {
  icon: IconName;
  label: string;
  to: string;
}

const navigation: NavigationItem[] = [
  { icon: "dashboard", label: "Overview", to: "/" },
  { icon: "box", label: "Products", to: "/products" },
  { icon: "users", label: "Users", to: "/users" }
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/products")) return "Products";
  if (pathname.startsWith("/users")) return "Users";
  if (pathname === "/") return "Overview";
  return "Page not found";
}

export function AppShell() {
  const location = useLocation();
  const [isNavigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    setNavigationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isNavigationOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavigationOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isNavigationOpen]);

  return (
    <div className={isNavigationOpen ? "app-shell is-navigation-open" : "app-shell"}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside aria-label="Primary navigation" className="sidebar" id="primary-navigation">
        <div className="brand">
          <span aria-hidden="true" className="brand__mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>GitHub Practice Demo</strong>
           
          </span>
        </div>

        <nav className="navigation">
          <p className="navigation__label">Workspace</p>
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? "navigation__link is-active" : "navigation__link"
              }
              end={item.to === "/"}
              key={item.to}
              to={item.to}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="service-status">
            <span aria-hidden="true" className="service-status__dot" />
            <span>
              <strong>All systems operational</strong>
              <small>ASP.NET Core API</small>
            </span>
          </div>
        
        </div>
      </aside>

      {isNavigationOpen ? (
        <button
          aria-label="Dismiss navigation"
          className="navigation-scrim"
          onClick={() => setNavigationOpen(false)}
          type="button"
        />
      ) : null}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar__leading">
            <span className="topbar__menu">
              <IconButton
                aria-controls="primary-navigation"
                aria-expanded={isNavigationOpen}
                icon={isNavigationOpen ? "close" : "menu"}
                label={isNavigationOpen ? "Close navigation" : "Open navigation"}
                onClick={() => setNavigationOpen((current) => !current)}
              />
            </span>
            <div>
              <span className="topbar__eyebrow">Workspace</span>
              <strong>{getPageTitle(location.pathname)}</strong>
            </div>
          </div>

          <div className="topbar__actions">
            <span className="environment-badge">
              <span aria-hidden="true" />
              Live demo
            </span>
            <div aria-label="Signed in as Diksha Deshmukh" className="profile">
              <Avatar name="Diksha Deshmukh" />
              <span>
                <strong>Diksha Deshmukh</strong>
                <small>Administrator</small>
              </span>
            </div>
          </div>
        </header>

        <main className="main-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
