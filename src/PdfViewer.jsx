import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc

const PDF_OPTIONS = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/',
}

export default function PdfViewer() {
  const { filename } = useParams()
  const containerRef = useRef(null)
  const touchStartX = useRef(null)

  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [width, setWidth] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [renderedPages, setRenderedPages] = useState(0)

  const fileUrl = useMemo(() => {
    const name = decodeURIComponent(filename || '')
    const withExt = /\.pdf$/i.test(name) ? name : `${name}.pdf`
    return `/pdf/${encodeURIComponent(withExt)}`
  }, [filename])

  useEffect(() => {
    setPageNumber(1)
    setNumPages(0)
    setLoadError(null)
    setRenderedPages(0)
  }, [fileUrl])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const next = useCallback(() => {
    setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))
  }, [numPages])

  const prev = useCallback(() => {
    setPageNumber((p) => Math.max(1, p - 1))
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      } else if (e.key === 'Home') {
        setPageNumber(1)
      } else if (e.key === 'End') {
        if (numPages) setPageNumber(numPages)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, numPages])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) {
      if (dx < 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  const onClickArea = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x > rect.width / 2) next()
    else prev()
  }

  return (
    <div
      ref={containerRef}
      className={`viewer ${isFullscreen ? 'fullscreen' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="stage" onClick={onClickArea}>
        <div className="overlay-controls" onClick={(e) => e.stopPropagation()}>
          <span className="pager">
            {pageNumber} / {numPages || '…'}
          </span>
          <button onClick={toggleFullscreen} aria-label="전체화면 토글">
            {isFullscreen ? '전체화면 해제' : '전체화면'}
          </button>
        </div>
        {loadError ? (
          <div className="error">
            PDF를 불러오지 못했습니다: {loadError}
            <div className="hint">경로: {fileUrl}</div>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(err) => setLoadError(err?.message || '알 수 없는 오류')}
            loading={<div className="loading">불러오는 중…</div>}
            options={PDF_OPTIONS}
            className="doc"
          >
            {width > 0 &&
              numPages > 0 &&
              Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className="page-slot"
                  style={{ visibility: n === pageNumber ? 'visible' : 'hidden' }}
                  aria-hidden={n !== pageNumber}
                >
                  <Page
                    pageNumber={n}
                    width={width}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onRenderSuccess={() => setRenderedPages((c) => c + 1)}
                  />
                </div>
              ))}
          </Document>
        )}

        {numPages > 0 && renderedPages < numPages && (
          <div className="preload-indicator">
            페이지 미리 로딩 {renderedPages} / {numPages}
          </div>
        )}

        <button
          className="nav prev"
          onClick={(e) => {
            e.stopPropagation()
            prev()
          }}
          aria-label="이전 페이지"
        >
          ‹
        </button>
        <button
          className="nav next"
          onClick={(e) => {
            e.stopPropagation()
            next()
          }}
          aria-label="다음 페이지"
        >
          ›
        </button>
      </div>
    </div>
  )
}
