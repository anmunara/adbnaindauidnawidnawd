import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

export default function AdminLayout({ children }) {
    return (
        <Theme appearance="dark" accentColor="violet" panelBackground="translucent" radius="large">
            {children}
        </Theme>
    );
}
