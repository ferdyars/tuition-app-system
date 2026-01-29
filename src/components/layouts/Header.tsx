"use client";

import { Group, Burger, Title, Menu, UnstyledButton, Text, Avatar } from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile: () => void;
  toggleDesktop: () => void;
}

export default function Header({
  mobileOpened,
  desktopOpened,
  toggleMobile,
  toggleDesktop,
}: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger
          opened={mobileOpened}
          onClick={toggleMobile}
          hiddenFrom="sm"
          size="sm"
        />
        <Burger
          opened={desktopOpened}
          onClick={toggleDesktop}
          visibleFrom="sm"
          size="sm"
        />
        <Title order={3}>School Tuition</Title>
      </Group>

      <Menu shadow="md" width={200}>
        <Menu.Target>
          <UnstyledButton>
            <Group gap="xs">
              <Avatar size="sm" radius="xl" color="blue">
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Text size="sm" fw={500}>
                  {user?.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {user?.role}
                </Text>
              </div>
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item leftSection={<IconUser size={14} />}>
            Profile
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<IconLogout size={14} />}
            onClick={logout}
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
