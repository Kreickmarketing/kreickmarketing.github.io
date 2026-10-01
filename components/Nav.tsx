import Image from "next/image";
import Link from "next/link";

export default function Nav({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <header className="nav">
      <Link href="/" aria-label="ClearMark home">
        <Image src="/logo-white.png" alt="ClearMark Training" width={168} height={42} priority className="nav-logo" />
      </Link>
      <nav className="nav-links">
        <Link href="/" className="text-sm-medium nav-home">Home</Link>
        <Link href="/about" className="text-sm-medium">About</Link>
        <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="button button-action">
          Book a call
        </a>
      </nav>
    </header>
  );
}
