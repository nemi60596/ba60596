import React from "react";

interface RowSelectorProps<T> {
  row: T;
  isSelected: boolean;
  onToggleSelection: (id: number) => void;
  renderRow: (row: T) => React.ReactNode;
  idField: keyof T;
}

export default function RowSelector<T>({
  row,
  isSelected,
  onToggleSelection,
  renderRow,
  idField,
}: RowSelectorProps<T>) {
  const id = row[idField] as unknown as number; 
  return (
    <tr
      className={`bg-white border-b ${
        isSelected ? "bg-blue-100" : "hover:bg-gray-50"
      }`}
    >
      <td className="py-4 px-6">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(id)}
          className="cursor-pointer"
        />
      </td>
      {renderRow(row)}
    </tr>
  );
}
