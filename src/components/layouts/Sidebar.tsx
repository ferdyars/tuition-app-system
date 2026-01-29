"use client";

import { NavLink } from "@mantine/core";
import {
  IconAlertTriangle,
  IconBuilding,
  IconCalendar,
  IconCash,
  IconChartBar,
  IconGift,
  IconHome,
  IconReceipt,
  IconReportAnalytics,
  IconSchool,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  children?: NavItem[];
}

const adminLinks: NavItem[] = [
  { icon: IconHome, label: "Dashboard", href: "/" },
  { icon: IconUsers, label: "Employees", href: "/employees" },
  { icon: IconSchool, label: "Students", href: "/students" },
  { icon: IconCalendar, label: "Academic Years", href: "/academic-years" },
  { icon: IconBuilding, label: "Classes", href: "/classes" },
  { icon: IconCash, label: "Tuitions", href: "/tuitions" },
  { icon: IconGift, label: "Scholarships", href: "/scholarships" },
  { icon: IconReceipt, label: "Payments", href: "/payments" },
  {
    icon: IconReportAnalytics,
    label: "Reports",
    children: [
      {
        icon: IconAlertTriangle,
        label: "Overdue Report",
        href: "/reports/overdue",
      },
      {
        icon: IconChartBar,
        label: "Class Summary",
        href: "/reports/class-summary",
      },
    ],
  },
];

const cashierLinks: NavItem[] = [
  { icon: IconHome, label: "Dashboard", href: "/" },
  { icon: IconSchool, label: "Students", href: "/students" },
  { icon: IconReceipt, label: "Payments", href: "/payments" },
  {
    icon: IconReportAnalytics,
    label: "Reports",
    children: [
      {
        icon: IconAlertTriangle,
        label: "Overdue Report",
        href: "/reports/overdue",
      },
      {
        icon: IconChartBar,
        label: "Class Summary",
        href: "/reports/class-summary",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = user?.role === "ADMIN" ? adminLinks : cashierLinks;

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (children?: NavItem[]) => {
    return children?.some((child) => child.href && isActive(child.href));
  };

  return (
    <nav>
      {links.map((link) => {
        if (link.children) {
          return (
            <NavLink
              key={link.label}
              label={link.label}
              leftSection={<link.icon size={20} />}
              defaultOpened={hasActiveChild(link.children)}
              childrenOffset={28}
            >
              {link.children.map((child) => (
                <NavLink
                  key={child.href}
                  component={Link}
                  href={child.href!}
                  label={child.label}
                  leftSection={<child.icon size={18} />}
                  active={isActive(child.href!)}
                />
              ))}
            </NavLink>
          );
        }

        return (
          <NavLink
            key={link.href}
            component={Link}
            href={link.href!}
            label={link.label}
            leftSection={<link.icon size={20} />}
            active={isActive(link.href!)}
          />
        );
      })}
    </nav>
  );
}
