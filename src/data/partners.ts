export type Partner = {
  id: string;
  organization: string;
  type: string;
  projects: number | null;
  chapter: string;
  since: string;
};

export const partners: Partner[] = [
  {
    id: "1",
    organization: "Philabundance",
    type: "Nonprofit",
    projects: 3,
    chapter: "UPenn",
    since: "2022",
  },
  {
    id: "2",
    organization: "Pittsburgh Housing Auth.",
    type: "Housing",
    projects: 2,
    chapter: "CMU",
    since: "2023",
  },
  {
    id: "3",
    organization: "SLO Food Bank",
    type: "Nonprofit",
    projects: 1,
    chapter: "Cal Poly",
    since: "2024",
  },
  {
    id: "4",
    organization: "Local Habitat",
    type: "Housing",
    projects: 2,
    chapter: "Cornell",
    since: "2022",
  },
  {
    id: "5",
    organization: "Teach for America",
    type: "Education",
    projects: 1,
    chapter: "Michigan",
    since: "2023",
  },
  {
    id: "6",
    organization: "Community Foundation GT",
    type: "Nonprofit",
    projects: 1,
    chapter: "Georgia Tech",
    since: "2024",
  },
  {
    id: "7",
    organization: "NYC Coalition for Change",
    type: "Advocacy",
    projects: 1,
    chapter: "NYU",
    since: "2025",
  },
  {
    id: "8",
    organization: "Austin Relief Network",
    type: "Nonprofit",
    projects: null,
    chapter: "UT Austin",
    since: "2025",
  },
];
