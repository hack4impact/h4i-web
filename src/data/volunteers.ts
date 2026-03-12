export type Volunteer = {
  id: string;
  name: string;
  chapter: string;
  role: string;
  projects: number;
  gradYear: number | null;
  email: string | null;
  status: "Active" | "Hiatus" | "Inactive";
};

export const volunteers: Volunteer[] = [
  {
    id: "1",
    name: "Alex Chen",
    chapter: "University of Pennsylvania",
    role: "Tech Lead",
    projects: 2,
    gradYear: 2026,
    email: "achen@seas.upenn.edu",
    status: "Active",
  },
  {
    id: "2",
    name: "Mia Rivera",
    chapter: "California Polytechnic State, SLO",
    role: "Designer",
    projects: 3,
    gradYear: 2025,
    email: "mrivera@calpoly.edu",
    status: "Active",
  },
  {
    id: "3",
    name: "Raj Patel",
    chapter: "Georgia Institute of Technology",
    role: "Developer",
    projects: 1,
    gradYear: 2026,
    email: "rpatel@gatech.edu",
    status: "Active",
  },
  {
    id: "4",
    name: "Yuki Tanaka",
    chapter: "Cornell University",
    role: "Project Manager",
    projects: 2,
    gradYear: 2025,
    email: "ytanaka@cornell.edu",
    status: "Active",
  },
  {
    id: "5",
    name: "Emma Johnson",
    chapter: "Michigan State University",
    role: "Developer",
    projects: 1,
    gradYear: 2027,
    email: "ejohnson@umich.edu",
    status: "Active",
  },
  {
    id: "6",
    name: "Sofia Martinez",
    chapter: "New York University",
    role: "Tech Lead",
    projects: 1,
    gradYear: 2026,
    email: "smartinez@nyu.edu",
    status: "Active",
  },
  {
    id: "7",
    name: "David Kim",
    chapter: "California Polytechnic State, SLO",
    role: "Developer",
    projects: 2,
    gradYear: 2025,
    email: null,
    status: "Hiatus",
  },
  {
    id: "8",
    name: "Chris Park",
    chapter: "University of Pennsylvania",
    role: "Design Lead",
    projects: 2,
    gradYear: null,
    email: null,
    status: "Inactive",
  },
];
