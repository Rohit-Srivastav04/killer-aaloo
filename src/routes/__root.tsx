import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "KILLER AALOO";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no",
      },
      { title: APP_NAME },
      {
        name: "description",
        content: "Killer Aaloo — a 2D side-scrolling run-and-gun. Clear 30 levels and drop each boss.",
      },
      { name: "theme-color", content: "#0c1410" },
    ],
    links: [
      { rel: "icon", type: "image/jpeg", href: "/killer-aaloo-icon.jpg" },
      { rel: "preload", as: "image", href: "/lobby-bay.jpg" },
      { rel: "preload", as: "image", href: "/lobby-bay-tall.jpg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
