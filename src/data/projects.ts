export type Project = {
  id: string;
  name: string;
  chapter: string;
  type: string;
  volunteers: number;
  partner: string;
  status: "Active" | "Scoping" | "Complete" | "Inactive";
};

export const projects: Project[] = [
  {
    id: "1",
    name: "Grant Finder",
    chapter: "Georgia Institute of Technology",
    type: "Full-stack",
    volunteers: 3,
    partner: "Community Foundation",
    status: "Scoping",
  },
  {
    id: "2",
    name: "Volunteer Management",
    chapter: "California Polytechnic State, SLO",
    type: "Design",
    volunteers: 4,
    partner: "SLO Food Bank",
    status: "Scoping",
  },
  {
    id: "3",
    name: "Resource Map",
    chapter: "New York University",
    type: "Full-stack",
    volunteers: 4,
    partner: "NYC Coalition",
    status: "Scoping",
  },
  {
    id: "4",
    name: "Food Bank App",
    chapter: "University of Pennsylvania",
    type: "Full-stack",
    volunteers: 8,
    partner: "Philabundance",
    status: "Active",
  },
  {
    id: "5",
    name: "Housing Tracker",
    chapter: "Carnegie Mellon University",
    type: "Data",
    volunteers: 6,
    partner: "Pittsburgh Housing Auth.",
    status: "Active",
  },
  {
    id: "6",
    name: "Education Portal",
    chapter: "Michigan State University",
    type: "Consulting",
    volunteers: 7,
    partner: "Teach for America",
    status: "Active",
  },
  {
    id: "7",
    name: "Impact Dashboard",
    chapter: "Cornell University",
    type: "Develop",
    volunteers: 5,
    partner: "Local Habitat",
    status: "Complete",
  },
];
