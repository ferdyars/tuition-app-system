"use client";

import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconAlertTriangle, IconHome, IconRefresh } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorLayout({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

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
            {t("somethingWentWrong")}
          </Title>
          <Text c="dimmed" ta="center" maw={400}>
            {t("message")}
          </Text>
          {error.message && (
            <Paper withBorder p="sm" bg="red.0" w="100%" maw={400}>
              <Text size="sm" c="red" style={{ fontFamily: "monospace" }}>
                {error.message}
              </Text>
            </Paper>
          )}
          <Group>
            <Button leftSection={<IconRefresh size={18} />} onClick={reset}>
              {t("tryAgain")}
            </Button>
            <Button
              variant="light"
              leftSection={<IconHome size={18} />}
              component={Link}
              href="/"
            >
              {t("goHome")}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
