import { ReactNode } from "react";
import ClientLayout from "../client-layout";

export default function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
