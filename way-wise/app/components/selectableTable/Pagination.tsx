import { NavLink, useLocation } from "@remix-run/react";

interface PaginationProps {
  page: number;
  totalPages: number;
  sortField?: string | null;
  sortOrder?: string | null;
  currentFilters?: Record<string, string>;
}

export default function Pagination({
  page,
  totalPages,
  sortField,
  sortOrder,
  currentFilters,
}: PaginationProps) {
  const location = useLocation();

  const getUrlWithParams = (newPage: number) => {
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("page", String(newPage));
    if (sortField) {
      urlParams.set("sortField", sortField);
    }
    if (sortOrder) {
      urlParams.set("sortOrder", sortOrder);
    }
    if (currentFilters) {
      for (const [key, value] of Object.entries(currentFilters)) {
        if (key !== "page") {
          urlParams.set(key, value);
        }
      }
    }
    return `?${urlParams.toString()}`;
  };

  return (
    <nav aria-label="Pagination" className="mt-4">
      <ul className="flex justify-between items-center text-sm font-medium">
        <li>
          {page > 1 ? (
            <NavLink
              to={getUrlWithParams(page - 1)}
              className="py-2 px-4 leading-tight text-blue-600 bg-white rounded-md hover:bg-blue-100 hover:text-blue-700"
              aria-label="Previous page"
              prefetch="intent"
            >
              Previous
            </NavLink>
          ) : (
            <span className="py-2 px-4 leading-tight text-gray-400 bg-white rounded-md">
              Previous
            </span>
          )}
        </li>
        <li className="text-gray-700">
          Page {page} of {totalPages}
        </li>
        <li>
          {page < totalPages ? (
            <NavLink
              to={getUrlWithParams(page + 1)}
              className="py-2 px-4 leading-tight text-blue-600 bg-white rounded-md hover:bg-blue-100 hover:text-blue-700"
              aria-label="Next page"
              prefetch="intent"
            >
              Next
            </NavLink>
          ) : (
            <span className="py-2 px-4 leading-tight text-gray-400 bg-white rounded-md">
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
