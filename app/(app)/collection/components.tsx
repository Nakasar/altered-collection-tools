'use client';

import {ArrowTopRightOnSquareIcon} from "@heroicons/react/24/outline";

export function ExportCollection() {
  async function exportDatabase() {
    const response = await fetch('/api/collection/exports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(error);
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('filename') ?? `swu-export-collection-${new Date().toISOString()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            onClick={exportDatabase}>
      <ArrowTopRightOnSquareIcon className="w-5 h-5 inline"/> Exporter
    </button>
  );
}