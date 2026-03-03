import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Pulse – Company Communication",
  description: "Stay connected with your team",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "8px",
              background: "#1e293b",
              color: "#f1f5f9",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
