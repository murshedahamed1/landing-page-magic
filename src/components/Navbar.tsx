import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Curriculum", href: "#curriculum" },
    { name: "Benefits", href: "#about" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <a href="#" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">X</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">Xenlogy</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>Admin Panel</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
                <Button variant="ghost" size="sm" onClick={signOut}>Log Out</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="font-medium" onClick={() => navigate("/auth")}>Log In</Button>
                <Button className="gradient-primary text-primary-foreground font-semibold shadow-soft" onClick={() => navigate("/auth")}>
                  Enroll Now
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2" onClick={() => setIsOpen(false)}>
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? (
                  <>
                    {isAdmin && <Button variant="outline" onClick={() => { navigate("/admin"); setIsOpen(false); }}>Admin Panel</Button>}
                    <Button variant="outline" onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>Dashboard</Button>
                    <Button variant="ghost" className="justify-start" onClick={signOut}>Log Out</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/auth"); setIsOpen(false); }}>Log In</Button>
                    <Button className="gradient-primary text-primary-foreground font-semibold" onClick={() => { navigate("/auth"); setIsOpen(false); }}>Enroll Now</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
