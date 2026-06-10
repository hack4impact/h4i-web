export interface TeamMember {
  name: string;
  role: "Tech Lead" | "Developer" | "Designer" | "Project Manager";
}

export type ProjectSection =
  | {
      type: "text";
      title: string;
      content: string;
    }
  | {
      type: "image";
      caption?: string;
    }
  | {
      type: "two-column";
      text: string;
      imagePosition: "left" | "right";
    }
  | {
      type: "image-grid";
      count: number;
    };

export interface Project {
  id: string;
  slug: string;
  title: string;
  status?: string;
  partner: string;
  chapter: string;
  year: string;
  tag: string;
  description: string;
  intro: string;
  sections: ProjectSection[];
  team: TeamMember[];
  duration: string;
  technologies?: string[];
  website?: string;
  github?: string;
}
