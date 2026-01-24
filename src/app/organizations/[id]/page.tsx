import { getOrganization } from "@/lib/actions/super-admin";
import { notFound } from "next/navigation";
import { OrganizationDetail } from "@/components/admin/organization-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getOrganization(id);

  if (!result.success || !result.organization) {
    notFound();
  }

  return (
    <OrganizationDetail 
      organization={result.organization} 
      members={result.members || []}
      userCount={result.userCount || 0}
    />
  );
}
