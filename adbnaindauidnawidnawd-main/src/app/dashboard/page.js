import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Link from "next/link";
import { Flex, Grid, Card, Heading, Text, Box, Button, Badge } from "@radix-ui/themes";
import { PersonIcon, GearIcon, ExitIcon } from "@radix-ui/react-icons";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    return (
        <Flex direction="column" gap="5">
            <Box>
                <Heading size="8" mb="2">Overview</Heading>
                <Text size="3" color="gray">Welcome back, {session.user?.email}</Text>
            </Box>

            <Grid columns={{ initial: "1", sm: "2" }} gap="4">

                {/* Profile Card */}
                <Card size="3">
                    <Flex gap="3" align="center" mb="4">
                        <PersonIcon width="24" height="24" color="var(--violet-9)" />
                        <Heading size="4">User Profile</Heading>
                    </Flex>

                    <Flex direction="column" gap="4">
                        <Box>
                            <Text as="div" size="2" color="gray" mb="1">Registered Email</Text>
                            <Text size="3" weight="medium">{session.user?.email}</Text>
                        </Box>
                        <Box>
                            <Text as="div" size="2" color="gray" mb="1">Unique User ID</Text>
                            <Card variant="surface" style={{ padding: '8px', background: 'var(--gray-3)' }}>
                                <Text size="2" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    {session.user?.id}
                                </Text>
                            </Card>
                        </Box>
                    </Flex>
                </Card>

                {/* Account Actions Card */}
                <Card size="3">
                    <Flex gap="3" align="center" mb="4">
                        <GearIcon width="24" height="24" color="var(--pink-9)" />
                        <Heading size="4">Account</Heading>
                    </Flex>

                    <Flex direction="column" gap="4">
                        <Box>
                            <Text as="div" size="2" color="gray" mb="2">Session Status</Text>
                            <Badge color="green" variant="soft" radius="full">
                                Active Now
                            </Badge>
                        </Box>

                        <Box pt="2">
                            <Text as="div" size="2" color="gray" mb="2">Danger Zone</Text>
                            <Link href="/api/auth/signout" style={{ textDecoration: 'none' }}>
                                <Button color="red" variant="soft" style={{ width: '100%', cursor: 'pointer' }}>
                                    <ExitIcon />
                                    Log Out
                                </Button>
                            </Link>
                        </Box>
                    </Flex>
                </Card>

            </Grid>
        </Flex>
    );
}
