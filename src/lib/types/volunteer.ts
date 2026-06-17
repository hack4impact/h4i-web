export interface Volunteer {
  id: string
  name: string
  status: string | null
  chapter: string
  roles: string[]
  major: string[]
  gradYear: number | null
  links: {
    linkedin: string | null
    github: string | null
    portfolio: string | null
  }
}
