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
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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
        <Paper withBorder p="xl" radius="md" maw={500} mx="auto" mt="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={60} color="red" variant="light">
              <IconAlertTriangle size={30} />
            </ThemeIcon>
            <Title order={3} ta="center">
              Something went wrong
            </Title>
            <Text c="dimmed" ta="center" size="sm">
              An unexpected error occurred. Please try refreshing the page or
              contact support if the problem persists.
            </Text>
            {this.state.error && (
              <Paper withBorder p="sm" bg="red.0" w="100%">
                <Text size="xs" c="red" style={{ fontFamily: "monospace" }}>
                  {this.state.error.message}
                </Text>
              </Paper>
            )}
            <Group>
              <Button
                leftSection={<IconRefresh size={18} />}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button variant="light" onClick={this.handleReset}>
                Try Again
              </Button>
            </Group>
          </Stack>
        </Paper>
      );
    }

    return this.props.children;
  }
}
