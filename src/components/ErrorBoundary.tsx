"use client";

import {
  Button,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

interface ErrorFallbackProps {
  error?: Error;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const t = useTranslations();

  return (
    <Paper withBorder p="xl" radius="md" maw={500} mx="auto" mt="xl">
      <Stack align="center" gap="md">
        <ThemeIcon size={60} color="red" variant="light">
          <IconAlertTriangle size={30} />
        </ThemeIcon>
        <Title order={3} ta="center">
          {t("error.somethingWentWrong")}
        </Title>
        <Text c="dimmed" ta="center" size="sm">
          {t("error.message")}
        </Text>
        {error && (
          <Paper withBorder p="sm" bg="red.0" w="100%">
            <Text size="xs" c="red" style={{ fontFamily: "monospace" }}>
              {error.message}
            </Text>
          </Paper>
        )}
        <Group>
          <Button
            leftSection={<IconRefresh size={18} />}
            onClick={() => window.location.reload()}
          >
            {t("error.refreshPage")}
          </Button>
          <Button variant="light" onClick={onReset}>
            {t("error.tryAgain")}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}
