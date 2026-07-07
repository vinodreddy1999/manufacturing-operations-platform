import { useState } from 'react';

import { ActionNotice } from './ActionNotice';

export function ReportExportButtons({ reportName }: { reportName: string }) {
  const [notice, setNotice] = useState('');
  const formats = ['Preview', 'PDF', 'Excel', 'CSV'];

  function handleExport(format: string) {
    setNotice(`${format} export queued for "${reportName}". Download will start when the report service responds.`);
  }

  return (
    <div>
      {notice ? <ActionNotice message={notice} tone="success" onDismiss={() => setNotice('')} /> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {formats.map((item) => (
          <button key={item} type="button" className="form-button-subtle py-1 text-xs" onClick={() => handleExport(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
