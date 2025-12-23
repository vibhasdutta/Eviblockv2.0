'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, User, LogOut, Home, Info, LayoutDashboard, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface User {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
}

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Fetch user from server session
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      // Clear all sensitive KYC data on logout
      const { clearAllKycData } = await import('@/lib/kycCleanup');
      await clearAllKycData();

      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menu: MenuItem[] = [
    { title: "Home", url: "/" },
    { title: "About", url: "/about" },
    { title: "Dashboard", url: "/dashboard" },
    { title: "Contact", url: "/contact" },
  ];

  const renderMenuItem = (item: MenuItem) => {
    if (item.items) {
      return (
        <NavigationMenuItem key={item.title}>
          <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
          <NavigationMenuContent className="bg-popover text-popover-foreground">
            {item.items.map((subItem) => (
              <NavigationMenuLink asChild key={subItem.title} className="w-80">
                <SubMenuLink item={subItem} />
              </NavigationMenuLink>
            ))}
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }

    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuLink
          href={item.url}
          className={`text-white hover:bg-gray-800 hover:text-white inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:bg-gray-800 focus:text-white focus:outline-none ${pathname === item.url ? 'bg-gray-800 text-white' : ''
            }`}
        >
          {item.title}
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  };

  const renderMobileMenuItem = (item: MenuItem) => {
    if (item.items) {
      return (
        <AccordionItem key={item.title} value={item.title} className="border-b-0">
          <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="mt-2">
            {item.items.map((subItem) => (
              <SubMenuLink key={subItem.title} item={subItem} />
            ))}
          </AccordionContent>
        </AccordionItem>
      );
    }

    return (
      <a key={item.title} href={item.url} className={`text-md font-semibold ${pathname === item.url ? 'text-primary' : ''}`}>
        {item.title}
      </a>
    );
  };

  return (
    <section className="bg-black text-white border-b border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Menu */}
        <nav className="hidden h-16 items-center justify-between lg:flex">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Eviblock
              </span>
            </a>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex gap-3">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Button asChild variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white">
                      <a href="/profile">
                        <User className="h-4 w-4 mr-2" />
                        {user.displayName || 'Profile'}
                      </a>
                    </Button>
                    <Button onClick={handleLogout} variant="secondary" size="sm">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white">
                      <a href="/login">Login</a>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <a href="/signup">Sign up</a>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Eviblock
              </span>
            </a>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800 hover:text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <a href="/" className="flex items-center gap-2">
                      <span className="text-xl font-bold tracking-tight">
                        Eviblock
                      </span>
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>

                  {!loading && (
                    <div className="flex flex-col gap-3 border-t pt-4">
                      {user ? (
                        <>
                          <Button asChild variant="outline">
                            <a href="/profile">
                              <User className="h-4 w-4 mr-2" />
                              {user.displayName || 'Profile'}
                            </a>
                          </Button>
                          <Button onClick={handleLogout} variant="default">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button asChild variant="outline">
                            <a href="/login">Login</a>
                          </Button>
                          <Button asChild variant="default">
                            <a href="/signup">Sign up</a>
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <a
      className="hover:bg-muted hover:text-accent-foreground flex min-w-80 select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors"
      href={item.url}
    >
      <div className="text-foreground">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-muted-foreground text-sm leading-snug">
            {item.description}
          </p>
        )}
      </div>
    </a>
  );
};
