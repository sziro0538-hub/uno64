"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/models", label: "Models" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/pages", label: "Pages" },
  ];

  return (
    <aside className="w-64 bg-black text-white p-4 fixed h-screen overflow-y-auto">
      <h2 className="font-bold text-lg mb-8">ADMIN</h2>

      <ul className="space-y-3">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`
                  block px-4 py-2 rounded-md transition
                  ${
                    isActive
                      ? "bg-orange-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }
                `}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
