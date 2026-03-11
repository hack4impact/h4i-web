export type Chapter = {
  id: string;
  name: string;
  university: string;
  volunteers: number;
  projects: number | null;
  coExecDirectors: string | null;
  status: "Active" | "Forming" | "Inactive";
};

export const chapters: Chapter[] = [
  {
    id: "1",
    name: "University of Pennsylvania",
    university: "University of Pennsylvania",
    volunteers: 52,
    projects: 8,
    coExecDirectors: "Sarah L.",
    status: "Active",
  },
  {
    id: "2",
    name: "California Polytechnic State",
    university: "California Polytechnic State",
    volunteers: 48,
    projects: 6,
    coExecDirectors: "James K.",
    status: "Active",
  },
  {
    id: "3",
    name: "Georgia Institute of Technology",
    university: "Georgia Institute of Technology",
    volunteers: 41,
    projects: 7,
    coExecDirectors: "Priya N.",
    status: "Active",
  },
  {
    id: "4",
    name: "University of Michigan",
    university: "University of Michigan",
    volunteers: 38,
    projects: 4,
    coExecDirectors: "Kevin M.",
    status: "Active",
  },
  {
    id: "5",
    name: "Cornell University",
    university: "Cornell University",
    volunteers: 35,
    projects: 5,
    coExecDirectors: "Michael T.",
    status: "Active",
  },
  {
    id: "6",
    name: "New York University",
    university: "New York University",
    volunteers: 29,
    projects: 3,
    coExecDirectors: "Dana R.",
    status: "Active",
  },
  {
    id: "7",
    name: "University of Texas at Austin",
    university: "University of Texas at Austin",
    volunteers: 7,
    projects: null,
    coExecDirectors: "Luis F.",
    status: "Forming",
  },
  {
    id: "8",
    name: "Carnegie Mellon University",
    university: "Carnegie Mellon University",
    volunteers: 12,
    projects: 1,
    coExecDirectors: null,
    status: "Inactive",
  },
];
