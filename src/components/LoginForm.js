"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flex, TextField, Button, Text, Callout, Checkbox, Box } from "@radix-ui/themes";
import { EnvelopeClosedIcon, LockClosedIcon, InfoCircledIcon } from "@radix-ui/react-icons";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result.error) {
                setError("Invalid email or password");
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin}>
            <Flex direction="column" gap="4" mt="4">
                {error && (
                    <Callout.Root color="red" size="1">
                        <Callout.Icon>
                            <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                    </Callout.Root>
                )}

                <Box>
                    <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>Email</Text>
                    <TextField.Root placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required>
                        <TextField.Slot>
                            <EnvelopeClosedIcon height="16" width="16" />
                        </TextField.Slot>
                    </TextField.Root>
                </Box>

                <Box>
                    <Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>Password</Text>
                    <TextField.Root type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required>
                        <TextField.Slot>
                            <LockClosedIcon height="16" width="16" />
                        </TextField.Slot>
                    </TextField.Root>
                </Box>

                <Flex align="center" gap="2">
                    <Checkbox id="remember-me" defaultChecked />
                    <Text as="label" htmlFor="remember-me" size="2">Remember me</Text>
                </Flex>

                <Button type="submit" size="3" variant="solid" loading={loading} style={{ cursor: 'pointer' }}>
                    {loading ? "Signing In..." : "Sign In"}
                </Button>
            </Flex>
        </form>
    );
}
