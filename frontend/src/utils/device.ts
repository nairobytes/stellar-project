/** True for phones/tablets in mobile browsers (not desktop). */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const coarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches === true
  return mobileUa || (coarsePointer && window.innerWidth < 1024)
}
