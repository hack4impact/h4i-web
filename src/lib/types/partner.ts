export interface Partner {
  id: string;
  slug: string;
  name: string;
  location: string;
  projectCount: number;
  description: string;
  website?: string;
  organizationTypes?: string[];
  populations?: string[];
  subjects?: string[];
}
