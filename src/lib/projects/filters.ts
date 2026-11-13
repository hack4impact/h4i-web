export const stageLabels = {
  design: "Design",
  development: "Development",
  launched: "Launched",
  maintenance: "Maintenance",
} as const;

export const lengthLabels = {
  short: "Under 3 months",
  medium: "3–6 months",
  long: "Over 6 months",
  ongoing: "Ongoing",
} as const;

export type ProjectFilters = {
  q?: string;
  chapter_id?: string;
  stage?: keyof typeof stageLabels;
  project_length?: keyof typeof lengthLabels;
  impact_area?: string;
  page?: number;
  page_size?: number;
};
