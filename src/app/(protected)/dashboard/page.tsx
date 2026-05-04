import { PageHeader } from "@/components/ui/PageHeader";
import {
  InfoCard,
  InfoCardRow,
  InfoCardField,
  InfoCardSectionHeader,
  ContactField,
} from "@/components/ui/InfoCard";
import { Badge } from "@/components/ui/Badge";
import { RosterCard } from "@/components/ui/RosterCard";
import type { RosterEntry } from "@/components/ui/RosterCard";
import { SelectDemo, ComboboxDemo } from "./DropdownsDemo";

const rosterEntries: RosterEntry[] = [
  { name: "Sarah Liu", role: "Tech Lead", term: "Sp '25" },
  { name: "Jamie Chen", role: "Designer", term: "Sp '25" },
  { name: "Alex Martinez", role: "Developer", term: "Sp '25" },
  { name: "Priya Tran", role: "Developer", term: "Sp '25" },
  { name: "Marcus Tran", role: "Project Manager", term: "Sp '25" },
  { name: "Sarah Liu", role: "Tech Lead", term: "Fa '24" },
  { name: "Jordan Park", role: "Designer", term: "Fa '24" },
  { name: "Alex Martinez", role: "Developer", term: "Fa '24" },
];

export default function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto pt-32">
      <PageHeader title="Dashboard">
        <div className="h-36" />
      </PageHeader>

      <div className="flex flex-col gap-16 px-32 py-16">
        <RosterCard
          entries={rosterEntries}
          heading="Project Team"
          currentTerm="Sp '25"
          className="max-w-2xl"
        />
        <SelectDemo />
        <ComboboxDemo />
        {/* Vertical: one field per row */}
        <InfoCard heading="Volunteer Details" className="max-w-2xl">
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
            <InfoCardField label="Organization" href="/partners">
              Code for America
            </InfoCardField>
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
        <InfoCard className="max-w-2xl">
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

        {/* ContactField: person stacked (default) */}
        <InfoCard heading="Project Contacts — Stacked" className="max-w-2xl">
          <InfoCardRow>
            <ContactField
              name="Jane Smith"
              subtitle="Chapter Lead"
              contact="jane@example.com"
              type="email"
            />
            <ContactField
              name="Marcus Lee"
              subtitle="Project Manager"
              contact="marcus@example.com"
              type="email"
            />
          </InfoCardRow>
        </InfoCard>

        {/* ContactField: person inline — contact beside name/subtitle */}
        <InfoCard heading="Project Contacts — Inline" className="max-w-2xl">
          <InfoCardRow>
            <ContactField
              name="Jane Smith"
              subtitle="Chapter Lead"
              contact="jane@example.com"
              type="email"
              layout="inline"
            />
          </InfoCardRow>
          <InfoCardRow>
            <ContactField
              name="Marcus Lee"
              subtitle="Project Manager"
              contact="marcus@example.com"
              type="email"
              layout="inline"
            />
          </InfoCardRow>
        </InfoCard>

        {/* ContactField: label mode — different contact types for one person */}
        <InfoCard heading="Contact" className="max-w-2xl">
          <InfoCardRow>
            <ContactField
              label="Work Email"
              contact="info@codeforamerica.org"
              type="email"
            />
            <ContactField
              label="Personal"
              contact="jane@gmail.com"
              type="email"
            />
            <ContactField
              label="Phone"
              contact="+1 415-555-0192"
              type="phone"
            />
          </InfoCardRow>
        </InfoCard>
      </div>
    </div>
  );
}
