// Landing layout - completely standalone, no sidebar, no dark mode
// The html element from root layout has suppressHydrationWarning.
// We lock light mode via inline style.
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
