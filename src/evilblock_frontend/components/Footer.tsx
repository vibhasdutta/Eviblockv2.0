import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  const footerLinks = [
    { name: 'About', href: '/about' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold text-white hover:text-gray-300 transition-colors underline decoration-2 underline-offset-4">
                Eviblock
              </span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              Building the future of blockchain technology with innovative solutions for secure file verification.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white underline decoration-1 underline-offset-2">
              Navigation
            </h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-300 hover:text-white transition-colors underline decoration-1 underline-offset-2 hover:decoration-2"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white underline decoration-1 underline-offset-2">
              Connect
            </h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-200 transform hover:scale-110 underline decoration-1 underline-offset-2"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} <span className="underline decoration-1 underline-offset-2">Eviblock</span>. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors underline decoration-1 underline-offset-2">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors underline decoration-1 underline-offset-2">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
