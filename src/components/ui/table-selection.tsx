'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { TableHead } from '@/components/ui/table'

interface TableSelectionProps<T> {
  items: T[]
  selected: Set<string | number>
  onSelect: (id: string | number, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  getId: (item: T) => string | number
  showCheckbox?: boolean
}

export function TableSelection<T>({
  items,
  selected,
  onSelect,
  onSelectAll,
  getId,
  showCheckbox = true,
}: TableSelectionProps<T>) {
  const allSelected = items.length > 0 && items.every(item => selected.has(getId(item)))
  const someSelected = selected.size > 0 && !allSelected

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked)
  }

  if (!showCheckbox) return null

  return (
    <TableHead className="w-12">
      <Checkbox
        checked={allSelected}
        onCheckedChange={handleSelectAll}
        aria-label="Select all"
      />
    </TableHead>
  )
}

export function TableRowCheckbox<T>({
  item,
  selected,
  onSelect,
  getId,
}: {
  item: T
  selected: Set<string | number>
  onSelect: (id: string | number, selected: boolean) => void
  getId: (item: T) => string | number
}) {
  const id = getId(item)
  const isSelected = selected.has(id)

  return (
    <td className="w-12">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(id, checked as boolean)}
        aria-label={`Select item ${id}`}
      />
    </td>
  )
}
