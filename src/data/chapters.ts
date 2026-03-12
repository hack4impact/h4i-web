export type Chapter = {
  id: string;
  name: string;
  place: string | null;
  foundedYear: number | null;
  volunteers: number;
  projects: number | null;
  status: "Active" | "Forming" | "Inactive";
};

export const chapters: Chapter[] = [
  {
    id: "1",
    name: "University of Pennsylvania",
    place: "Philadelphia, PA",
    foundedYear: 2021,
    volunteers: 52,
    projects: 8,
    status: "Active",
  },
  {
    id: "2",
    name: "California Polytechnic State",
    place: "San Luis Obispo, CA",
    foundedYear: 2022,
    volunteers: 48,
    projects: 6,
    status: "Active",
  },
  {
    id: "3",
    name: "Georgia Institute of Technology",
    place: "Atlanta, GA",
    foundedYear: 2022,
    volunteers: 41,
    projects: 7,
    status: "Active",
  },
  {
    id: "4",
    name: "University of Michigan",
    place: "Ann Arbor, MI",
    foundedYear: 2023,
    volunteers: 38,
    projects: 4,
    status: "Active",
  },
  {
    id: "5",
    name: "Cornell University",
    place: "Ithaca, NY",
    foundedYear: 2022,
    volunteers: 35,
    projects: 5,
    status: "Active",
  },
  {
    id: "6",
    name: "New York University",
    place: "New York, NY",
    foundedYear: 2023,
    volunteers: 29,
    projects: 3,
    status: "Active",
  },
  {
    id: "7",
    name: "University of Texas at Austin",
    place: "Austin, TX",
    foundedYear: 2025,
    volunteers: 7,
    projects: null,
    status: "Forming",
  },
  {
    id: "8",
    name: "Carnegie Mellon University",
    place: "Pittsburgh, PA",
    foundedYear: 2023,
    volunteers: 12,
    projects: 1,
    status: "Inactive",
  },
];
