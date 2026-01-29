import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Tuition Management System",
  description: "Manage school tuitions, payments, and scholarships",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>
          <MantineProvider defaultColorScheme="dark">
            <ModalsProvider>
              <Notifications position="top-right" />
              {children}
            </ModalsProvider>
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
