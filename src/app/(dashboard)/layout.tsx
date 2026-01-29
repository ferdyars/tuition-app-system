"use client";

import { AppShell, LoadingOverlay } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import ErrorBoundary from "@/components/ErrorBoundary";
import Header from "@/components/layouts/Header";
import Sidebar from "@/components/layouts/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  // Authentication is handled by middleware - no need to redirect here

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Header
          mobileOpened={mobileOpened}
          desktopOpened={desktopOpened}
          toggleMobile={toggleMobile}
          toggleDesktop={toggleDesktop}
        />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <ErrorBoundary>{children}</ErrorBoundary>
      </AppShell.Main>
    </AppShell>
  );
}
