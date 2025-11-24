import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import "./globals.css";

export const metadata: Metadata = {
  title: "Village Data Management System",
  description: "A secure web application for managing village household, member, business, and infrastructure data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          <ConfirmDialogProvider>
            {children}
          </ConfirmDialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
