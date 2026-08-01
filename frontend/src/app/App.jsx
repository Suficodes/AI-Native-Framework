import { useEffect, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { AppShell } from "@astryxdesign/core/AppShell"
import { SideNav, SideNavSection, SideNavItem, SideNavHeading } from "@astryxdesign/core/SideNav"
import { MobileNavToggle } from "@astryxdesign/core/MobileNav"
import { Button } from "@astryxdesign/core/Button"
import { HStack } from "@astryxdesign/core/HStack"
import { Text } from "@astryxdesign/core/Text"
import { Selector } from "@astryxdesign/core/Selector"
import { Popover } from "@astryxdesign/core/Popover"
import { CommandPalette } from "@astryxdesign/core/CommandPalette"
import { createStaticSource } from "@astryxdesign/core/Typeahead"
import { DewaMark } from "../dewa/DewaLogo.jsx"
import { getMode, toggleMode } from "../lib/theme.js"
import { RoleSwitcher } from "../components/RoleSwitcher.jsx"
import { Breadcrumbs } from "../components/Breadcrumbs.jsx"
import { ROLES } from "../data/roles.ts"
import { CONTROL_TOWER_NAV, PROJECT_NAV, ALL_NAV } from "./nav.jsx"

// Chrome-level icon-only buttons (dark/light toggle, search trigger,
// notifications bell) stay raw Astryx <Button size="sm" isIconOnly> — they are
// compact toolbar affordances, not the primary/secondary/ghost CTAs DESIGN.md's
// "every button is a 48px pill" rule targets. Primary/secondary/ghost CTAs
// inside pages must import DewaButton (see dewa/DewaButton.jsx), not this.
const svg = (...d) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const Sun = () => svg(<circle key="a" cx="12" cy="12" r="4" />, <path key="b" d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />)
const Moon = () => svg(<path key="a" d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />)
const SearchIcon = () => svg(<circle key="a" cx="11" cy="11" r="7" />, <path key="b" d="M21 21l-4.3-4.3" />)
const BellIcon = () => svg(<path key="a" d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />, <path key="b" d="M10 19a2 2 0 0 0 4 0" />)

const PERIOD_OPTIONS = [
  { value: "Q1-2026", label: "Q1 2026" },
  { value: "Q2-2026", label: "Q2 2026" },
  { value: "Q3-2026", label: "Q3 2026 (current)" },
  { value: "FY-2026", label: "FY 2026 (year to date)" },
]

const SEARCH_ITEMS = ALL_NAV.map((item) => ({
  id: item.path,
  label: item.label,
  auxiliaryData: { group: PROJECT_NAV.includes(item) ? "Project" : "Control Tower" },
}))
const searchSource = createStaticSource(SEARCH_ITEMS)

export default function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const [mode, setMode] = useState(getMode())
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [roleId, setRoleId] = useState(ROLES[0].id)
  const [period, setPeriod] = useState("Q3-2026")

  // Astryx's CommandPalette does not forward its `label` prop to the input it
  // renders, so the global search box reaches assistive tech with no accessible
  // name (only a "Search..." placeholder). Labelling it from here is the only
  // fix available without forking the component.
  useEffect(() => {
    const input = document.querySelector('.astryx-command-palette-input input')
    if (input && !input.getAttribute("aria-label")) input.setAttribute("aria-label", "Global search")
  }, [searchOpen])

  // Hover-overlay rail (DEWA default): on hover-capable devices the menu is a
  // narrow icon lane that expands as an OVERLAY on hover/focus (content never
  // reflows); touch devices get a tap toggle + the mobile drawer below the breakpoint.
  const hoverCapable = useMemo(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches,
    [],
  )
  const [railOpen, setRailOpen] = useState(false)

  // { viewTransition: true } wraps the navigation in the native View Transitions
  // API → a quiet cross-fade between pages, 0 KB, reduced-motion-safe.
  const go = (path) => (e) => { e?.preventDefault?.(); navigate(path, { viewTransition: true }); setNavOpen(false) }

  const railHoverProps = hoverCapable
    ? {
        onMouseEnter: () => setRailOpen(true),
        onMouseLeave: () => setRailOpen(false),
        onFocusCapture: () => setRailOpen(true),
        onBlurCapture: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setRailOpen(false) },
      }
    : {}

  const rail = (
    <SideNav
      className={hoverCapable ? "dewa-rail" : undefined}
      collapsible={hoverCapable
        ? { isCollapsed: !railOpen, onCollapsedChange: (c) => setRailOpen(!c), hasButton: false }
        : { defaultIsCollapsed: false, hasButton: true, buttonLabel: "Toggle menu" }}
      {...railHoverProps}
      header={<SideNavHeading icon={<DewaMark size={28} />} heading="Control Tower" subheading="DEWA · AI-Native Enterprise" />}>
      <SideNavSection title="Control Tower">
        {CONTROL_TOWER_NAV.map((item) => (
          <SideNavItem key={item.path} label={item.label} icon={item.icon}
            isSelected={pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))}
            href={item.path} onClick={go(item.path)} />
        ))}
      </SideNavSection>
      <SideNavSection title="Project">
        {PROJECT_NAV.map((item) => (
          <SideNavItem key={item.path} label={item.label} icon={item.icon}
            isSelected={pathname === item.path} href={item.path} onClick={go(item.path)} />
        ))}
      </SideNavSection>
    </SideNav>
  )

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AppShell height="fill" contentPadding={0} sideNav={rail}
      mobileNav={{ isOpen: navOpen, onOpenChange: setNavOpen, hasToggle: false, breakpoint: "lg" }}>
      <div className="content-col">
        <div className="topbar">
          <HStack gap={2} align="center">
            <MobileNavToggle label="Open menu" />
            <Text weight="semibold">AI-Native Enterprise Control Tower</Text>
          </HStack>
          <HStack gap={3} align="center">
            <Selector label="Reporting period" isLabelHidden size="sm" width={190}
              options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
            <RoleSwitcher roleId={roleId} onRoleChange={setRoleId} />
            <Button variant="ghost" size="sm" isIconOnly label="Search (⌘K)" icon={<SearchIcon />}
              onClick={() => setSearchOpen(true)} />
            <Popover isOpen={notificationsOpen} onOpenChange={setNotificationsOpen}
              label="Notifications" placement="below" alignment="end" width={280}
              content={
                <div style={{ padding: "var(--spacing-1) 0" }}>
                  <Text weight="semibold" size="sm">Notifications</Text>
                  <Text color="secondary" size="sm" style={{ marginTop: "var(--spacing-2)" }}>
                    No new notifications. Attention items surface on the Executive Overview panel.
                  </Text>
                </div>
              }>
              <Button variant="ghost" size="sm" isIconOnly label="Notifications" icon={<BellIcon />} />
            </Popover>
            <Button variant="ghost" size="sm" isIconOnly
              label={mode === "dark" ? "Switch to light" : "Switch to dark"}
              icon={mode === "dark" ? <Sun /> : <Moon />}
              onClick={() => setMode(toggleMode())} />
          </HStack>
        </div>
        {/* Breadcrumbs live here rather than in each page: derived from the
            route, they cannot drift out of step with the router. The index
            route is the root, so it has nothing to trail back to. */}
        <div className="page-scroll" key={pathname}>
          <main id="main-content" tabIndex={-1}>
            {pathname !== "/" && (
              <div className="page-band page-band--wide" style={{ paddingBottom: 0, paddingTop: "var(--spacing-4)" }}>
                <Breadcrumbs />
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette
        isOpen={searchOpen}
        onOpenChange={setSearchOpen}
        label="Global search"
        searchSource={searchSource}
        onValueChange={(id) => { setSearchOpen(false); navigate(id, { viewTransition: true }) }}
      />
      </AppShell>
    </>
  )
}
