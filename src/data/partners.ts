export type Partner = {
  id: string;
  name: string;
  type: string;
  status: string | null;
  contactName: string | null;
  projects: number | null;
  chapter: string;
};

export const partners: Partner[] = [
  {
    id: "1",
    name: "Philabundance",
    type: "Nonprofit",
    status: "Active",
    contactName: "Maria Gonzalez",
    projects: 3,
    chapter: "UPenn",
  },
  {
    id: "2",
    name: "Pittsburgh Housing Auth.",
    type: "Housing",
    status: "Active",
    contactName: "Tom Bradley",
    projects: 2,
    chapter: "CMU",
  },
  {
    id: "3",
    name: "SLO Food Bank",
    type: "Nonprofit",
    status: "Active",
    contactName: "Sarah Kim",
    projects: 1,
    chapter: "Cal Poly",
  },
  {
    id: "4",
    name: "Local Habitat",
    type: "Housing",
    status: "Active",
    contactName: null,
    projects: 2,
    chapter: "Cornell",
  },
  {
    id: "5",
    name: "Teach for America",
    type: "Education",
    status: "Active",
    contactName: "James Park",
    projects: 1,
    chapter: "Michigan",
  },
  {
    id: "6",
    name: "Community Foundation GT",
    type: "Nonprofit",
    status: "Active",
    contactName: "Priya Nair",
    projects: 1,
    chapter: "Georgia Tech",
  },
  {
    id: "7",
    name: "NYC Coalition for Change",
    type: "Advocacy",
    status: "Prospect",
    contactName: null,
    projects: 1,
    chapter: "NYU",
  },
  {
    id: "8",
    name: "Austin Relief Network",
    type: "Nonprofit",
    status: "Prospect",
    contactName: "Luis Flores",
    projects: null,
    chapter: "UT Austin",
  },
];
