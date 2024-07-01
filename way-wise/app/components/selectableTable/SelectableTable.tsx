import {
  Form,
  useNavigate,
  useLocation,
  useNavigation,
} from "@remix-run/react";
import React, { useState, useEffect } from "react";

import Spinner from "../Spinner";

import ColumnSelector from "./ColumnSelector";
import Pagination from "./Pagination";
import RowSelector from "./RowSelector";

interface SelectableTableProps<T> {
  rows: T[];
  runId: string | null;
  error: string | null;
  page: number;
  totalPages: number;
  allRowIDs: number[];
  renderRow: (row: T, visibleFields: (keyof T)[]) => React.ReactNode;
  idField: keyof T;
  headers: { label: string; field: keyof T; sortable: boolean }[];
  formAction: string;
  filterOptions: { field: keyof T; placeholder: string }[];
  initialVisibleFields: (keyof T)[];
}

export default function SelectableTable<T>({
  rows,
  runId,
  error,
  page,
  totalPages,
  allRowIDs,
  renderRow,
  idField,
  headers,
  formAction,
  filterOptions,
  initialVisibleFields,
}: SelectableTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(() => {
    if (typeof window !== "undefined") {
      const savedRows = localStorage.getItem("selectedRows");
      return savedRows ? new Set(JSON.parse(savedRows)) : new Set();
    }
    return new Set();
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleFields, setVisibleFields] =
    useState<(keyof T)[]>(initialVisibleFields);

  const [allRowsSelected, setAllRowsSelected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const navigation = useNavigation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRows = localStorage.getItem("selectedRows");
      if (savedRows) {
        const parsedRows = JSON.parse(savedRows);
        setSelectedRows(new Set(parsedRows));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedRows", JSON.stringify([...selectedRows]));
    }
  }, [selectedRows]);

  const toggleRowSelection = (id: number) => {
    setAllRowsSelected(false);
    setSelectedRows((prevSelectedRows) => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(id)) {
        newSelectedRows.delete(id);
      } else {
        newSelectedRows.add(id);
      }
      return newSelectedRows;
    });
  };

  const selectAllRows = () => {
    setAllRowsSelected((prevAllRowsSelected) => {
      const newAllRowsSelected = !prevAllRowsSelected;
      if (newAllRowsSelected) {
        setSelectedRows(new Set(allRowIDs));
      } else {
        setSelectedRows(new Set());
      }
      return newAllRowsSelected;
    });
  };

  const handleSort = (field: keyof T) => {
    const currentSortField = urlParams.get("sortField");
    const currentSortOrder = urlParams.get("sortOrder") || "asc";
    const newSortOrder =
      currentSortField === String(field) && currentSortOrder === "asc"
        ? "desc"
        : "asc";
    urlParams.set("sortField", String(field));
    urlParams.set("sortOrder", newSortOrder);
    urlParams.delete("page");
    navigate(`?${urlParams.toString()}`);
  };

  const handleFieldToggle = (field: keyof T) => {
    setVisibleFields((prevFields) =>
      prevFields.includes(field)
        ? prevFields.filter((f) => f !== field)
        : [...prevFields, field],
    );
  };

  const handleFilterChange = (field: keyof T, value: string) => {
    if (value) {
      urlParams.set(`filter_${String(field)}`, value);
    } else {
      urlParams.delete(`filter_${String(field)}`);
    }
    urlParams.delete("page");
    navigate(`?${urlParams.toString()}`);
  };

  const sortField = urlParams.get("sortField");
  const sortOrder = urlParams.get("sortOrder");

  const currentFilters = Object.fromEntries(urlParams.entries());

  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="container mx-auto space-y-12">
        <div className="p-5 max-w-8xl mx-auto my-10 bg-white rounded-xl shadow-md">
          {navigation.state !== "idle" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
              <div className="spinner"></div>
              <Spinner />
            </div>
          ) : null}
          <h1 className="text-5xl font-bold text-blue-600 mb-4">Select Rows</h1>
          {error ? <div className="text-red-500">{error}</div> : null}
          <Form
            method="post"
            action={formAction}
            className={error ? "opacity-50 pointer-events-none" : ""}
          >
            <button
              onClick={() => setIsModalOpen(true)}
              type="button"
              className="mt-4 px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              Select Columns
            </button>

            <input type="hidden" name="runId" value={runId || ""} />
            <button
              onClick={() => {
                setSelectedRows(new Set());
                setAllRowsSelected(false);
              }}
              type="button"
              className="mt-4 ml-4 px-4 py-2 text-sm text-white bg-green-500 rounded hover:bg-green-600"
            >
              Deselect All
            </button>

            <button
              onClick={selectAllRows}
              type="button"
              className="mt-4 ml-4 px-4 py-2 text-sm text-white bg-green-500 rounded hover:bg-green-600"
            >
              {allRowsSelected ? "Unselect All" : "Select All"}
            </button>
            <button
              type="submit"
              disabled={!!error}
              className="mt-4 ml-4 px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
            >
              Use Selected Coordinates
            </button>
            <input
              type="hidden"
              name="selectedRows"
              value={Array.from(selectedRows).join(",")}
            />
            <input
              type="hidden"
              name="allRowsSelected"
              value={allRowsSelected.toString()}
            />
            <input type="hidden" name="runId" value={runId?.toString() || ""} />

            <div className="flex flex-wrap mt-4">
              {filterOptions.map((option) => (
                <div key={String(option.field)} className="mr-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {
                      headers.find((header) => header.field === option.field)
                        ?.label
                    }
                  </label>
                  <input
                    type="text"
                    placeholder={option.placeholder}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    onChange={(e) =>
                      handleFilterChange(option.field, e.target.value)
                    }
                    defaultValue={
                      urlParams.get(`filter_${String(option.field)}`) || ""
                    }
                  />
                </div>
              ))}
            </div>

            <table className="w-full table-fixed text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="py-3 px-6 h-12 w-12">
                    Select
                  </th>
                  {headers
                    .filter((header) => visibleFields.includes(header.field))
                    .map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className={`py-3 px-6 cursor-pointer ${header.sortable ? "sortable" : ""}`}
                        onClick={() =>
                          header.sortable ? handleSort(header.field) : null
                        }
                        style={{ width: "auto" }} // Customize width here as needed
                      >
                        {header.label}
                        {sortField === String(header.field)
                          ? sortOrder === "asc"
                            ? " ▲"
                            : " ▼"
                          : null}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <RowSelector
                    key={row[idField] as unknown as number}
                    row={row}
                    isSelected={selectedRows.has(
                      row[idField] as unknown as number,
                    )}
                    onToggleSelection={toggleRowSelection}
                    renderRow={() => renderRow(row, visibleFields)}
                    idField={idField}
                  />
                ))}
              </tbody>
            </table>
          </Form>
          <Pagination
            page={page}
            totalPages={totalPages}
            sortField={sortField}
            sortOrder={sortOrder}
            currentFilters={currentFilters}
          />
          <ColumnSelector
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Select Columns"
          >
            {headers.map((header) => (
              <div key={String(header.field)} className="flex items-center">
                <input
                  id={String(header.field)}
                  type="checkbox"
                  checked={visibleFields.includes(header.field)}
                  onChange={() => handleFieldToggle(header.field)}
                  className="mr-2"
                />
                <label htmlFor={String(header.field)}>{header.label}</label>
              </div>
            ))}
          </ColumnSelector>
        </div>
      </div>
    </main>
  );
}
