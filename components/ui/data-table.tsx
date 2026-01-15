
import React, { useState, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./table"
import { Checkbox } from "./checkbox"
import { Button } from "./button"
import { Input } from "./input"
import { Tabs, TabsList, TabsTrigger } from "./tabs"
import { Badge } from "./badge"
import {
  ArrowUpDown, MoreHorizontal, ChevronRight,
  ChevronLeft, LayoutTemplate, MoreHorizontal as DotsVertical, Search
} from "../Icons"
import { cn } from "../../utils/utils"

export interface ColumnDef<TData> {
  accessorKey?: keyof TData | string
  id?: string
  header: string | ((props: { table: any, column: any }) => React.ReactNode)
  cell?: (props: { row: { original: TData, getIsSelected: () => boolean, toggleSelected: (v: boolean) => void }, getValue: (key?: string) => any }) => React.ReactNode
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  tabs?: { value: string, label: string, count?: number }[]
  onTabChange?: (val: string) => void
  onRowClick?: (row: TData) => void
  headerContent?: React.ReactNode
  actions?: React.ReactNode
}

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Filter results...",
  tabs,
  onTabChange,
  onRowClick,
  actions,
  headerContent
}: DataTableProps<TData>) {
  const [filterText, setFilterText] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.value || "all")
  const pageSize = 10

  const filteredData = useMemo(() => {
    let result = data
    if (filterText && searchKey) {
      result = result.filter((item: any) => String(item[searchKey]).toLowerCase().includes(filterText.toLowerCase()))
    }
    return result
  }, [data, filterText, searchKey])

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key]; const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage])

  const toggleSort = (key: string) => {
    setSortConfig(current => (current?.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }))
  }

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedRows(new Set(paginatedData.map((_, i) => i.toString())))
    else setSelectedRows(new Set())
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedRows(next)
  }

  return (
    <div className="space-y-6">
      {/* Upper Control Bar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-4 px-1">

        {/* Left Side Content (Title, Stats etc) */}
        <div className="w-full xl:w-auto">
          {headerContent}
        </div>

        {/* Right Side Tools */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full xl:w-auto justify-end">
          {tabs ? (
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); onTabChange?.(v); }} className="w-fit">
              <TabsList className="bg-zinc-100/50 p-1 rounded-lg border border-zinc-200/50">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 text-zinc-500 hover:text-zinc-700 transition-all rounded-md">
                    {tab.label} {tab.count !== undefined && <Badge variant="secondary" className="ml-2 bg-zinc-200/80 text-[9px] font-black px-1.5 py-0 min-w-[1.5rem] justify-center">{tab.count}</Badge>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : <div />}

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="relative flex-1 md:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-800 transition-colors" />
              <Input
                placeholder={searchPlaceholder}
                value={filterText}
                onChange={(e) => { setFilterText(e.target.value); setCurrentPage(1); }}
                className="h-9 pl-9 bg-white border-zinc-200 text-xs font-medium placeholder:text-zinc-400 focus-visible:ring-zinc-900 focus-visible:ring-offset-0 focus-visible:border-zinc-900 transition-all shadow-sm rounded-lg"
              />
            </div>
            {actions}
          </div>
        </div>
      </div>

      {/* ... rest of the table ... */}

      {/* Table Main */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm animate-in fade-in duration-500">
        <Table>
          <TableHeader className="bg-zinc-50/80 border-b border-zinc-100 rounded-t-2xl">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-4 rounded-tl-2xl">
                <Checkbox onCheckedChange={toggleAll} checked={selectedRows.size === paginatedData.length && paginatedData.length > 0} />
              </TableHead>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={cn("text-[10px] font-black uppercase text-zinc-400 tracking-[0.15em] py-4", idx === columns.length - 1 && "rounded-tr-2xl")}>
                  {typeof col.header === 'function' ? col.header({ table: {}, column: { toggleSorting: () => toggleSort(String(col.accessorKey)) } }) : col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <TableRow
                  key={rowIdx}
                  className={cn(
                    "group cursor-pointer hover:bg-zinc-50/50 transition-colors border-zinc-100",
                    selectedRows.has(rowIdx.toString()) && "bg-zinc-50/80"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  <TableCell className="w-10 px-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedRows.has(rowIdx.toString())} onCheckedChange={() => toggleRow(rowIdx.toString())} />
                  </TableCell>
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className="py-4">
                      {col.cell ? col.cell({
                        row: {
                          original: row,
                          getIsSelected: () => selectedRows.has(rowIdx.toString()),
                          toggleSelected: (v) => toggleRow(rowIdx.toString())
                        },
                        getValue: (key) => (row as any)[key || String(col.accessorKey)]
                      }) : (row as any)[String(col.accessorKey)]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length + 1} className="h-32 text-center text-zinc-400 italic text-sm">No results found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer - Moved Inside */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50/30 rounded-b-2xl">
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            {selectedRows.size} of {sortedData.length} records selected
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rows:</span>
              <select className="bg-transparent text-[11px] font-bold outline-none border-none cursor-pointer">
                <option>10</option><option>20</option><option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 border-zinc-200" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 border-zinc-200" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
