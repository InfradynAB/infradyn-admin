import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomePageStructuredData } from "@/components/seo/structured-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Infradyn - Materials Tracker & Procurement Management",
  description:
    "Your single source of truth for project management, from PO to payment. Streamline procurement, track materials, and manage suppliers efficiently with Infradyn.",
};

import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to login - middleware will handle auth
  redirect("/login");
}