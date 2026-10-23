import { Link } from "react-router-dom";

export default function Layout({ children, right, wide }) {
  return (
    <>
      <header className="top">
        <Link to="/" className="brand">
          <span className="logo">S</span> Simulateur SOIEC
        </Link>
        <nav>{right}</nav>
      </header>
      <main className={wide ? "wrap wide" : "wrap"}>{children}</main>
    </>
  );
}
