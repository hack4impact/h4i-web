'use client'

import { useMemo, useState } from 'react'

import type { Project } from '@/lib/types/project'
import { buildFilterOptions } from '@/lib/utils'

import { FilterBar } from '../FilterBar'
import { FilteredGrid } from '../FilteredGrid'
import { ProjectCard } from './ProjectCard'

type Sort = 'year-desc' | 'year-asc' | 'name-asc' | 'name-desc'

const SORT_OPTIONS = [
  { value: 'year-desc', label: 'Newest first' },
  { value: 'year-asc', label: 'Oldest first' },
  { value: 'name-asc', label: 'A–Z' },
  { value: 'name-desc', label: 'Z–A' },
]

interface ProjectsTableProps {
  projects: Project[]
  hideChapterFilter?: boolean
}

export function ProjectsTable({
  projects,
  hideChapterFilter = false,
}: ProjectsTableProps) {
  const [focusArea, setFocusArea] = useState('all')
  const [chapter, setChapter] = useState('all')
  const [year, setYear] = useState('all')
  const [sort, setSort] = useState<Sort>('year-desc')

  const focusAreaOptions = useMemo(
    () => buildFilterOptions(projects, (p) => p.tag),
    [projects],
  )

  const chapterOptions = useMemo(
    () => buildFilterOptions(projects, (p) => p.chapter),
    [projects],
  )

  const yearOptions = useMemo(
    () =>
      buildFilterOptions(
        projects,
        (p) => p.year,
        (a, b) => b.localeCompare(a),
      ),
    [projects],
  )

  const filtered = useMemo(() => {
    let list = [...projects]
    if (focusArea === '__none__') list = list.filter((p) => !p.tag)
    else if (focusArea !== 'all') list = list.filter((p) => p.tag === focusArea)
    if (chapter === '__none__') list = list.filter((p) => !p.chapter)
    else if (chapter !== 'all') list = list.filter((p) => p.chapter === chapter)
    if (year === '__none__') list = list.filter((p) => !p.year)
    else if (year !== 'all') list = list.filter((p) => p.year === year)

    list.sort((a, b) => {
      if (sort === 'year-desc') {
        if (!a.year && !b.year) return a.title.localeCompare(b.title)
        if (!a.year) return 1
        if (!b.year) return -1
        const diff = b.year.localeCompare(a.year)
        return diff !== 0 ? diff : a.title.localeCompare(b.title)
      }
      if (sort === 'year-asc') {
        if (!a.year && !b.year) return a.title.localeCompare(b.title)
        if (!a.year) return 1
        if (!b.year) return -1
        const diff = a.year.localeCompare(b.year)
        return diff !== 0 ? diff : a.title.localeCompare(b.title)
      }
      if (sort === 'name-asc') return a.title.localeCompare(b.title)
      return b.title.localeCompare(a.title)
    })

    return list
  }, [projects, focusArea, chapter, year, sort])

  const filters = [
    {
      label: 'Focus Area',
      value: focusArea,
      onValueChange: setFocusArea,
      options: focusAreaOptions,
    },
    ...(!hideChapterFilter
      ? [
          {
            label: 'Chapter',
            value: chapter,
            onValueChange: setChapter,
            options: chapterOptions,
          },
        ]
      : []),
    {
      label: 'Year',
      value: year,
      onValueChange: setYear,
      options: yearOptions,
    },
  ]

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <FilterBar
        filters={filters}
        sort={{
          label: 'Sort',
          value: sort,
          onValueChange: (v) => setSort(v as Sort),
          options: SORT_OPTIONS,
        }}
      />

      <FilteredGrid
        items={filtered}
        filterKey={`${focusArea}|${chapter}|${year}|${sort}`}
        gridClassName='grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        emptyMessage='No projects match the selected filters.'
        renderItem={(project) => <ProjectCard project={project} />}
        estimatedItemHeight={110}
        scrollable
      />
    </div>
  )
}
