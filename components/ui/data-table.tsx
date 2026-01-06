
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
  ChevronLeft, LayoutTemplate, MoreHorizontal as DotsVertical 
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
  actions
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-1">
        {tabs ? (
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); onTabChange?.(v); }} className="w-fit">
                <TabsList className="bg-zinc-100/80 p-1 rounded-xl">
                    {tabs.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value} className="px-4 py-1.5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            {tab.label} {tab.count !== undefined && <Badge variant="secondary" className="ml-2 bg-zinc-200/50 text-[9px] font-black px-1 py-0">{tab.count}</Badge>}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        ) : <div />}

        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Input
                    placeholder={searchPlaceholder}
                    value={filterText}
                    onChange={(e) => { setFilterText(e.target.value); setCurrentPage(1); }}
                    className="h-9 bg-white border-zinc-200 text-xs font-bold focus-visible:ring-zinc-950 pr-8"
                />
            </div>
            <Button variant="outline" size="sm" className="h-9 font-bold text-[11px] uppercase tracking-widest border-zinc-200">
                <LayoutTemplate className="h-3.5 w-3.5 mr-2" /> Columns
            </Button>
            {actions}
        </div>
      </div>
      
      {/* Table Main */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
        <Table>
          <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-4">
                 <Checkbox onCheckedChange={toggleAll} checked={selectedRows.size === paginatedData.length && paginatedData.length > 0} />
              </TableHead>
              {columns.map((col, idx) => (
                <TableHead key={idx} className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.15em] py-4">
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
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-1">
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
  )
}
