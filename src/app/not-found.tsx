"use client";

import {
  Button,
  Container,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconFileUnknown, IconHome } from "@tabler/icons-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("error");

  return (
    <Container size="sm" py="xl">
      <Paper withBorder p="xl" radius="md">
        <Stack align="center" gap="md">
          <ThemeIcon size={80} color="gray" variant="light">
            <IconFileUnknown size={40} />
          </ThemeIcon>
          <Title order={2} ta="center">
            {t("notFound")}
          </Title>
          <Text c="dimmed" ta="center" maw={400}>
            {t("notFoundMessage")}
          </Text>
          <Button
            leftSection={<IconHome size={18} />}
            component={Link}
            href="/"
          >
            {t("goToDashboard")}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
