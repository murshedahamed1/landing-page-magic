import { Mail } from "lucide-react";

const Footer = () => {
  const footerLinks = [
    { name: "Contact", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Refund Policy", href: "#" },
  ];

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8">
          {/* Brand */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">X</span>
            </div>
            <span className="font-display font-bold text-xl">Xenlogy</span>
          </a>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-background/60 hover:text-background transition-colors text-sm"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} Xenlogy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
