"use client";

import { useEffect } from "react";
import { Button, Stack, Text, Title, Paper, Group, ThemeIcon, Container } from "@mantine/core";
import { IconAlertTriangle, IconRefresh, IconHome } from "@tabler/icons-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <Container size="sm" py="xl">
      <Paper withBorder p="xl" radius="md">
        <Stack align="center" gap="md">
          <ThemeIcon size={80} color="red" variant="light">
            <IconAlertTriangle size={40} />
          </ThemeIcon>
          <Title order={2} ta="center">
            Something went wrong
          </Title>
          <Text c="dimmed" ta="center" maw={400}>
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </Text>
          {error.message && (
            <Paper withBorder p="sm" bg="red.0" w="100%" maw={400}>
              <Text size="sm" c="red" style={{ fontFamily: "monospace" }}>
                {error.message}
              </Text>
            </Paper>
          )}
          <Group>
            <Button
              leftSection={<IconRefresh size={18} />}
              onClick={reset}
            >
              Try Again
            </Button>
            <Button
              variant="light"
              leftSection={<IconHome size={18} />}
              component={Link}
              href="/"
            >
              Go Home
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
