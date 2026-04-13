import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/pdf-list.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((list) => setFiles(list))
      .catch(() => setError('PDF 목록을 불러오지 못했습니다.'))
  }, [])

  return (
    <div className="home">
      <h1>PDF Viewer</h1>
      {error && <p className="error">{error}</p>}
      <ul>
        {files.map((name) => (
          <li key={name}>
            <Link to={`/${encodeURIComponent(name.replace(/\.pdf$/i, ''))}`}>{name}</Link>
          </li>
        ))}
      </ul>
      <p className="hint">
        URL 형식: <code>/파일이름</code> (확장자 생략 가능)
      </p>
    </div>
  )
}
