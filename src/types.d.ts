/**
 * User completed kata list object, shape as stored in the userCompletedDB.json file
 */
export interface UserCompletedDBEntry {
  id: string
  name: string
  slug: string
  completedLanguages: string[]
  completedAt: string
}

/**
 * User completed kata list object as received from the Codewars API (https://www.codewars.com/api/v1/users/${config.username}/code-challenges/completed?page=${page})
 */
export interface CodewarsApiResponse {
  totalPages: number
  totalItems: number
  data: UserCompletedDBEntry[]
}

/**
 * Kata details object as received from the Codewars API (https://www.codewars.com/api/v1/code-challenges/${kata.id})
 */
export interface KataDetails {
  id: string
  name: string
  slug: string
  category: string
  publishedAt: string
  approvedAt: string
  languages: string[]
  url: string
  rank: { id: number; name: string; color: string }
  createdAt: string
  createdBy: { username: string; url: string }
  approvedBy: { username: string; url: string }
  description: string
  totalAttempts: number
  totalCompleted: number
  totalStars: number
  voteScore: number
  tags: string[]
  contributorsWanted: boolean
  unresolved: { issues: number; suggestions: number }
}

/**
 * Extended kata details object with additional properties for local file system and user completed kata list object
 */
export interface ExtendedKataDetails extends UserCompletedDBEntry, KataDetails {
  kataRankDirName: string
  kataPath: string
}

/**
 * Combined extended kata details object with user code solutions, test data and current language
 */
export interface CombinedKataDetail extends ExtendedKataDetails {
  curLang: string
  code: string
  tests: string
}

/**
 * User solutions list object
 */
export interface UserSolution {
  id?: string
  language?: string
  code?: string
}

/**
 * getPages config setting type
 * @property {boolean | number} getPages Config option to set the number of solution pages to scrape
 * - true: collect all pages of solutions;
 * - false: collect only first page of solutions;
 * - number: collect `number` of pages of solutions
 */
export type ConfigGetPages<T = boolean | number> = T extends number ? number : boolean
