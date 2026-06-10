import Image from "next/image";
import Link from "next/link";

const ORGANIZATION_LINKS = [
  { label: "About", href: "/about" },
  { label: "Chapters", href: "/work/chapters" },
  { label: "Projects", href: "/work/projects" },
  { label: "Partners", href: "/work/partners" },
];

const GET_INVOLVED_LINKS = [
  { label: "Start a Chapter", href: "/get-involved/students" },
  { label: "Apply for a Project", href: "/get-involved/nonprofits" },
  { label: "Be a Mentor", href: "/get-involved/mentors" },
  { label: "Sponsor Us", href: "/get-involved/sponsors" },
];

export default function Footer() {
  return (
    <footer className="border-separator bg-root border-t">
      {/* Main content */}
      <div className="px-8 py-10 md:px-16">
        <div className="mx-auto flex max-w-[1312px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          {/* Left: logomark + Candid seal side by side */}
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Hack4Impact">
              <Image
                src="/logomark.svg"
                alt="Hack4Impact"
                width={120}
                height={120}
                className="logo-adaptive h-20 w-20"
              />
            </Link>
            <a
              aria-label="Candid transparency seal"
              href="https://app.candid.org/profile/9565390/hack4impact-81-0790890/?pkId=ed396921-76d9-4a6a-a362-b68f17102c35"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="Candid Platinum Transparency Seal"
                src="https://widgets.guidestar.org/prod/v1/pdp/transparency-seal/9565390/svg"
                width={120}
                height={120}
                className="h-20 w-20"
              />
            </a>
          </div>

          {/* Right: nav columns */}
          <div className="flex gap-8 sm:gap-12 md:gap-16">
            <div>
              <p className="label-xs text-gray-4 mb-4">Organization</p>
              <ul className="space-y-2.5">
                {ORGANIZATION_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-3 hover:text-inverse font-sans text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label-xs text-gray-4 mb-4">Get Involved</p>
              <ul className="space-y-2.5">
                {GET_INVOLVED_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-3 hover:text-inverse font-sans text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-separator border-t px-8 py-4 md:px-16">
        <div className="mx-auto flex max-w-[1312px] items-center justify-between">
          <p className="text-gray-4 font-mono text-[10px] tracking-[0.04em]">
            © {new Date().getFullYear()} Hack4Impact Inc. d/b/a Hack for Impact
            · EIN 81-0790890
          </p>
          <p className="text-gray-4 font-mono text-[10px] tracking-[0.04em]">
            501(c)(3) Public Charity
          </p>
        </div>
      </div>
    </footer>
  );
}
