"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flex, Box, Text, ScrollArea } from "@radix-ui/themes";
import { DashboardIcon, MobileIcon } from "@radix-ui/react-icons";

export default function DashboardLayout({ children }) {
    const pathname = usePathname();

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: <DashboardIcon /> },
        { name: "Cloudphone", href: "/dashboard/cloudphone", icon: <MobileIcon /> },
    ];

    return (
        <Flex style={{ height: "100vh", background: "var(--color-background)" }}>
            {/* Sidebar */}
            <Box
                style={{
                    width: 250,
                    flexShrink: 0,
                    background: "var(--gray-2)",
                    borderRight: "1px solid var(--gray-5)",
                    display: "flex", // Ensure box behaves as flex container
                    flexDirection: "column",
                }}
            >
                <Flex align="center" gap="2" p="4" mb="2">
                    <Text size="5" weight="bold">⚡ KingBlox</Text>
                </Flex>

                <Flex direction="column" px="3" gap="1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                                <Flex
                                    align="center"
                                    gap="3"
                                    px="3"
                                    py="2"
                                    style={{
                                        borderRadius: "var(--radius-3)",
                                        background: isActive ? "var(--violet-4)" : "transparent",
                                        color: isActive ? "var(--violet-11)" : "var(--gray-11)",
                                        cursor: "pointer",
                                        transition: "background 0.2s",
                                    }}
                                >
                                    {item.icon}
                                    <Text size="2" weight={isActive ? "bold" : "regular"}>{item.name}</Text>
                                </Flex>
                            </Link>
                        );
                    })}
                </Flex>
            </Box>

            {/* Main Content */}
            <ScrollArea type="auto" scrollbars="vertical" style={{ flex: 1 }}>
                <Box p="5">
                    {children}
                </Box>
            </ScrollArea>
        </Flex>
    );
}
