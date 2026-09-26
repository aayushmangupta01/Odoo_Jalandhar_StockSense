import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Button } from './button';

export function DataTable({
  columns,
  data = [],
  searchPlaceholder = 'Search records...',
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search terms.',
  actions,
  filterControls,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const value = col.accessor ? item[col.accessor] : col.render ? col.render(item) : '';
        return String(value || '').toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const handleSort = (accessor) => {
    if (!accessor) return;
    if (sortColumn === accessor) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(accessor);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filterControls}
          {actions}
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.accessor && handleSort(col.accessor)}
                  className={`px-4 py-3.5 ${col.sortable !== false && col.accessor ? 'cursor-pointer select-none hover:text-slate-200' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable !== false && col.accessor && (
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <SlidersHorizontal className="w-8 h-8 text-slate-600 mb-1" />
                    <p className="text-base font-semibold text-slate-300 font-sans">{emptyTitle}</p>
                    <p className="text-sm text-slate-500 font-sans">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="hover:bg-slate-800/40 transition-colors font-sans"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-4 py-3 text-slate-300 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && sortedData.length > 0 && (
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{sortedData.length}</span> results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 text-slate-300 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
