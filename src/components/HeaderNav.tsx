'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export function HeaderNav({
  userEmail,
  isAdmin,
  sellerStatus,
}: {
  userEmail: string | null
  isAdmin: boolean
  sellerStatus: string
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const isApproved = sellerStatus === 'approved'

  // 공통 링크
  const baseLinks = [
    { href: '/plants',    label: '둘러보기' },
    { href: '/community', label: '커뮤니티' },
  ]

  // 로그인 상태에 따른 링크
  const authLinks = userEmail
    ? [
        // 승인된 판매자 → 식물 등록 / 그 외 → 판매자 신청
        isApproved
          ? { href: '/sell',          label: '식물 등록' }
          : { href: '/seller/apply',  label: '판매자 신청' },
        // 관리자에게만 관리자 메뉴 표시
        ...(isAdmin ? [{ href: '/admin', label: '관리자' }] : []),
      ]
    : []

  const links = [...baseLinks, ...authLinks]

  return (
    <>
      {/* ── 헤더 한 줄 ── */}
      <div className="flex items-center justify-between h-14">

        {/* 로고 */}
        <Link href="/" className="font-semibold text-lg tracking-tight">
          PLOTT
        </Link>

        {/* 데스크탑 메뉴 (md 이상) */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {label}
            </Link>
          ))}

          {userEmail ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 max-w-[120px] truncate">{userEmail}</span>
              <form action={logout}>
                <button type="submit" className="text-sm text-gray-600 hover:text-black transition-colors">
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="text-sm text-gray-600 hover:text-black transition-colors">
              로그인
            </Link>
          )}
        </nav>

        {/* 햄버거 버튼 (md 미만) */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 -mr-2 text-gray-600"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6"  x2="17" y2="6" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14" x2="17" y2="14" />
            </svg>
          )}
        </button>
      </div>

      {/* ── 모바일 드롭다운 ── */}
      {open && (
        <nav className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="px-1 py-2 text-sm text-gray-600 hover:text-black"
            >
              {label}
            </Link>
          ))}

          <div className="h-px bg-gray-100 my-1" />

          {userEmail ? (
            <>
              <span className="px-1 py-2 text-sm text-gray-400 truncate">{userEmail}</span>
              <form action={logout}>
                <button
                  type="submit"
                  onClick={close}
                  className="px-1 py-2 text-sm text-gray-600 hover:text-black w-full text-left"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" onClick={close} className="px-1 py-2 text-sm text-gray-600 hover:text-black">
              로그인
            </Link>
          )}
        </nav>
      )}
    </>
  )
}
