import {
  getAssetUrl,
  getBoardTeamMembers,
  getFAQs,
  getInfoCards,
  getJournalEntries,
  getJournalEntryBySlug,
  getPaginatedJournalEntries,
  getProcess,
  getSponsors,
  getSponsorshipTiers,
} from './api'

export const contentfulApi = {
  getJournalEntries,
  getPaginatedJournalEntries,
  getJournalEntryBySlug,
  getBoardTeamMembers,
  getSponsors,
  getSponsorshipTiers,
  getAssetUrl,
  getFAQs,
  getProcess,
  getInfoCards,
}
