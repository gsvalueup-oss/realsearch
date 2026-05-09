'use client'

import { tdStyle, thStyle } from '../_lib/adminStyles'

interface SyncTableProps {
  title: string
  color: string
  bg: string
  items: any[]
  csvType: string
  showChanges: boolean
}

export default function SyncTable({
  title,
  color,
  bg,
  items,
  csvType,
  showChanges,
}: SyncTableProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 8 }}>{title}</h3>
      <div style={{ background: bg, borderRadius: 8, overflow: 'auto', maxHeight: 256 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, background: 'transparent' }}>{csvType === 'office' ? '등록번호' : '이름'}</th>
              <th style={{ ...thStyle, background: 'transparent' }}>{csvType === 'office' ? '사무소명' : '소속'}</th>
              {showChanges && <th style={{ ...thStyle, background: 'transparent' }}>변경 항목</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ ...tdStyle, borderColor: 'rgba(255,255,255,0.05)' }}>
                  {csvType === 'office' ? item.registration_number : item.name}
                </td>
                <td style={{ ...tdStyle, borderColor: 'rgba(255,255,255,0.05)' }}>{item.office_name}</td>
                {showChanges && (
                  <td style={{ ...tdStyle, fontSize: 11, borderColor: 'rgba(255,255,255,0.05)' }}>
                    {Object.keys(item.changes).map((key) => (
                      <div key={key} style={{ marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>{key}:</span> {item.changes[key].before} → {item.changes[key].after}
                      </div>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
