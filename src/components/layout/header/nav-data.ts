export type DropdownKey = "Work" | "Get Involved";

export const dropdowns: Record<DropdownKey, { label: string; href: string }[]> =
  {
    Work: [
      { label: "Chapters", href: "/work/chapters" },
      { label: "Projects", href: "/work/projects" },
      { label: "Partners", href: "/work/partners" },
    ],
    "Get Involved": [
      { label: "Nonprofits", href: "/get-involved/nonprofits" },
      { label: "Students", href: "/get-involved/students" },
      { label: "Mentors", href: "/get-involved/mentors" },
      { label: "Sponsors", href: "/get-involved/sponsors" },
    ],
  };

export const dropdownKeys = Object.keys(dropdowns) as DropdownKey[];

export type MobileItem =
  | { key: string; type: "link"; label: string; href: string }
  | { key: string; type: "dropdown"; label: string; dropdownKey: DropdownKey };

export const mobileItems: MobileItem[] = [
  { key: "about", type: "link", label: "About", href: "/about" },
  { key: "work", type: "dropdown", label: "Work", dropdownKey: "Work" },
  {
    key: "get-involved",
    type: "dropdown",
    label: "Get Involved",
    dropdownKey: "Get Involved",
  },
];
