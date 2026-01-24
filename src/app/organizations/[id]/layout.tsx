import { ReactNode } from "react";

export default function OrganizationDetailLayout({ children }: { children: ReactNode }) {
  // Parent layout (organizations/layout.tsx) already provides sidebar/header
  return <>{children}</>;
}
