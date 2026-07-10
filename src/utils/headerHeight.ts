export function getHeaderHeight(): number {
  const header = document.querySelector("header");
  return header ? header.offsetHeight : 0;
}
