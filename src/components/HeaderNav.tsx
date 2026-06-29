'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

const NAV = [
  { href: '/plants',    label: 'PLANTS' },
  { href: '/plants',    label: 'SHOP' },
  { href: '/community', label: 'COMMUNITY' },
  { href: '/',          label: 'ABOUT' },
]

export function HeaderNav({
  userEmail,
  isAdmin,
}: {
  userEmail: string | null
  isAdmin: boolean
}) {
  const [userMenu,   setUserMenu]   = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  /* 드롭다운 바깥 클릭 시 닫기 */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenu(false)
      }
    }
    if (userMenu) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [userMenu])

  return (
    <>
      {/* ── 헤더 한 줄: 로고 | 메뉴 | 아이콘 ── */}
      <div className="grid grid-cols-3 items-center h-[60px]">

        {/* 왼쪽: PLOTT 로고 + 형광 별표 */}
        <div>
          <Link href="/" className="font-logo font-black text-2xl tracking-[0.25em] text-charcoal select-none inline-flex items-center gap-1.5">
            PLOTT
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
                 stroke="#D4F034" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="7.5" y1="1"   x2="7.5" y2="14"/>
              <line x1="1"   y1="7.5" x2="14"  y2="7.5"/>
              <line x1="3"   y1="3"   x2="12"  y2="12"/>
              <line x1="12"  y1="3"   x2="3"   y2="12"/>
            </svg>
          </Link>
        </div>

        {/* 가운데: 메뉴 (데스크탑) */}
        <nav className="hidden md:flex justify-center items-center gap-9">
          {NAV.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="text-[11px] font-semibold tracking-[0.18em] text-charcoal hover:text-gray-400 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 오른쪽: 아이콘들 (데스크탑) */}
        <div className="hidden md:flex justify-end items-center gap-5">

          {/* 검색 */}
          <button className="text-charcoal hover:text-gray-400 transition-colors" aria-label="검색">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7.5"/>
              <path d="M20.5 20.5l-4.5-4.5"/>
            </svg>
          </button>

          {/* 유저 */}
          <div className="relative" ref={menuRef}>
            {userEmail ? (
              <>
                {/* 아이콘 버튼 → 드롭다운 열기 */}
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="text-charcoal hover:text-gray-400 transition-colors"
                  aria-label="내 계정"
                  aria-expanded={userMenu}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </button>

                {/* 드롭다운 */}
                {userMenu && (
                  <div className="absolute right-0 top-full mt-3 bg-white border border-gray-100
                                  rounded-2xl shadow-lg shadow-black/5 py-2 min-w-[160px] z-50">
                    <Link
                      href="/my"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal
                                 hover:bg-gray-50 transition-colors rounded-t-xl"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      마이페이지
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal
                                   hover:bg-gray-50 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        관리자
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <form action={logout}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                                     text-gray-400 hover:text-charcoal hover:bg-gray-50
                                     transition-colors rounded-b-xl"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          로그아웃
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 비로그인: 아이콘 → 로그인 페이지 */
              <Link href="/login" className="text-charcoal hover:text-gray-400 transition-colors" aria-label="로그인">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </Link>
            )}
          </div>

          {/* 장바구니 */}
          <button className="relative text-charcoal hover:text-gray-400 transition-colors" aria-label="장바구니">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span className="absolute -top-1.5 -right-1.5 bg-lime text-charcoal text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
              0
            </span>
          </button>
        </div>

        {/* 햄버거 (모바일) */}
        <div className="md:hidden flex justify-end">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="p-2 -mr-2 text-charcoal"
            aria-label={mobileMenu ? '닫기' : '메뉴'}
          >
            {mobileMenu ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="4" x2="16" y2="16"/>
                <line x1="16" y1="4" x2="4" y2="16"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6"  x2="17" y2="6"/>
                <line x1="3" y1="10" x2="17" y2="10"/>
                <line x1="3" y1="14" x2="17" y2="14"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── 모바일 드롭다운 ── */}
      {mobileMenu && (
        <nav className="md:hidden border-t border-gray-100 py-4 flex flex-col gap-0.5">
          {NAV.map(({ href, label }) => (
            <Link key={label} href={href} onClick={() => setMobileMenu(false)}
              className="px-1 py-3 text-sm font-semibold tracking-widest text-charcoal hover:text-gray-400">
              {label}
            </Link>
          ))}
          <div className="h-px bg-gray-100 my-2"/>
          {userEmail ? (
            <>
              <span className="px-1 py-2 text-xs text-gray-400 truncate">{userEmail}</span>
              <Link href="/my" onClick={() => setMobileMenu(false)}
                className="px-1 py-3 text-sm text-charcoal font-medium">
                마이페이지
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileMenu(false)}
                  className="px-1 py-3 text-sm text-charcoal font-medium">
                  관리자
                </Link>
              )}
              <form action={logout}>
                <button type="submit" onClick={() => setMobileMenu(false)}
                  className="px-1 py-3 text-sm text-gray-400 w-full text-left">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" onClick={() => setMobileMenu(false)}
              className="px-1 py-3 text-sm text-charcoal font-medium">
              로그인 / 회원가입
            </Link>
          )}
        </nav>
      )}
    </>
  )
}
