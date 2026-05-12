import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const getSnapshot = React.useCallback(() => window.innerWidth < MOBILE_BREAKPOINT, [])
  const getServerSnapshot = React.useCallback(() => false, [])

  return React.useSyncExternalStore(
    React.useCallback((onStoreChange) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    }, []),
    getSnapshot,
    getServerSnapshot,
  )
}
