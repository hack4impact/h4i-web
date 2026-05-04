import { PageHeader } from "@/components/ui/PageHeader";
import {
  InfoCard,
  InfoCardRow,
  InfoCardField,
  InfoCardSectionHeader,
} from "@/components/ui/InfoCard";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto pt-32">
      <PageHeader title="Dashboard">
        <div className="h-36" />
      </PageHeader>

      <div className="flex flex-col gap-16 px-32 py-16">
        {/* Vertical: one field per row */}
        <InfoCard heading="Volunteer Details" className="max-w-lg">
          <InfoCardRow>
            <InfoCardField label="Status">
              <Badge label="Active" color="green" />
            </InfoCardField>
          </InfoCardRow>
          <InfoCardRow>
            <InfoCardField label="Chapter">Boston University</InfoCardField>
          </InfoCardRow>
          <InfoCardRow>
            <InfoCardField label="Role">Chapter Lead</InfoCardField>
          </InfoCardRow>
        </InfoCard>

        {/* Horizontal: multiple fields in the same row */}
        <InfoCard heading="Project Overview" className="max-w-2xl">
          <InfoCardRow>
            <InfoCardField label="Status">
              <Badge label="In Progress" color="blue" />
            </InfoCardField>
            <InfoCardField label="Organization">Code for America</InfoCardField>
            <InfoCardField label="Founded">2019</InfoCardField>
          </InfoCardRow>
          <InfoCardSectionHeader>Skills Needed</InfoCardSectionHeader>
          <InfoCardRow>
            <InfoCardField>
              <div className="flex flex-wrap gap-8">
                <Badge label="React" color="blue" />
                <Badge label="TypeScript" color="purple" />
                <Badge label="Design" color="pink" />
              </div>
            </InfoCardField>
          </InfoCardRow>
          <InfoCardSectionHeader variant="subsection">
            Resources
          </InfoCardSectionHeader>
          <InfoCardRow>
            <InfoCardField label="GitHub">github.com/cfa/project</InfoCardField>
            <InfoCardField label="Drive">drive.google.com/...</InfoCardField>
          </InfoCardRow>
        </InfoCard>

        {/* No heading */}
        <InfoCard className="max-w-lg">
          <InfoCardRow>
            <InfoCardField label="Location">San Francisco, CA</InfoCardField>
            <InfoCardField label="Tags">
              <div className="flex flex-wrap gap-8">
                <Badge label="Civic Tech" color="orange" />
                <Badge label="Education" color="green" />
              </div>
            </InfoCardField>
          </InfoCardRow>
        </InfoCard>

        {/* layout="auto": fields size to content */}
        <InfoCard heading="Auto-width Fields" className="max-w-2xl">
          <InfoCardRow layout="auto">
            <InfoCardField label="Status">
              <Badge label="Active" color="green" />
            </InfoCardField>
            <InfoCardField label="Role">Chapter Lead</InfoCardField>
            <InfoCardField label="Tags">
              <div className="flex flex-wrap gap-8">
                <Badge label="Civic Tech" color="orange" />
                <Badge label="Education" color="green" />
                <Badge label="Design" color="pink" />
              </div>
            </InfoCardField>
          </InfoCardRow>
        </InfoCard>
      </div>
    </div>
  );
}
