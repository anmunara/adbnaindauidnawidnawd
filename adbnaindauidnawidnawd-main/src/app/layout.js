import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Providers } from "./Providers";
import { Theme } from "@radix-ui/themes";

export const viewport = {
  themeColor: "#0f0c29",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Login Page",
  description: "Simple clean login landing page",
  openGraph: {
    title: "Login Page",
    description: "Simple clean login landing page",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Theme appearance="dark" accentColor="violet" panelBackground="translucent" radius="large">
            {children}
          </Theme>
        </Providers>
      </body>
    </html>
  );
}
