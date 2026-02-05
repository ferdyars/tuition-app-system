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

export default function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Paper withBorder p="xl" radius="md">
        <Stack align="center" gap="md">
          <ThemeIcon size={80} color="gray" variant="light">
            <IconFileUnknown size={40} />
          </ThemeIcon>
          <Title order={2} ta="center">
            Page Not Found
          </Title>
          <Text c="dimmed" ta="center" maw={400}>
            The page you are looking for does not exist or has been moved.
          </Text>
          <Button
            leftSection={<IconHome size={18} />}
            component={Link}
            href="/admin/dashboard"
          >
            Go to Dashboard
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
