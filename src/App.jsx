import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { HiOutlineMenuAlt1, HiX } from "react-icons/hi";
import HomePage from "./pages/HomePage";
import CalmSpace from "./pages/CalmSpace";
import CompanionAI from "./pages/CompanionAi";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

        {/* Side Menu for mobile */}
        {menuOpen && <MobileNav setMenuOpen={setMenuOpen} />}

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/calm" element={<CalmSpace />} />
            <Route path="*" element={<HomePage />} />
            <Route path="/companion" element={<CompanionAI />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Header({ menuOpen, setMenuOpen }) {
  return (
    <header className="sticky top-0 z-50 h-16 w-full flex px-4 py-3 justify-between items-center border-b border-gray-300 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-1 rounded hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <HiX size={27} /> : <HiOutlineMenuAlt1 size={27} />}
        </button>

        <h1 className="text-2xl font-bold font-sans italic">Growth Snap</h1>
      </div>

      <div className="flex items-center gap-2">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}

function MobileNav({ setMenuOpen }) {
  const location = useLocation();
  const links = [
    { path: "/", label: "Home" },
    { path: "/calm", label: "Calm Space" },
    { path: "/companion", label: "Companion AI" },
  ];

  return (
    <nav className="absolute top-16 left-0 w-64 bg-white shadow-md h-full z-40 flex flex-col p-4 md:hidden">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          onClick={() => setMenuOpen(false)}
          className={`p-2 rounded hover:bg-gray-100 text-left ${
            location.pathname === link.path ? "font-bold text-blue-600" : ""
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function DesktopNav() {
  const location = useLocation();
  const links = [
    { path: "/", label: "Home" },
    { path: "/calm", label: "Calm Space" },
  ];

  return (
    <nav className="hidden md:flex gap-4 px-6 py-3 border-b border-gray-200">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`p-2 rounded hover:bg-gray-100 ${
            location.pathname === link.path ? "font-bold text-blue-600" : ""
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default App;
