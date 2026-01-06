import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "UNO64",
  description: "Hot Wheels collector app",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
