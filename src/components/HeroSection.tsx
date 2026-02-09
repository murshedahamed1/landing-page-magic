import { Play, Star, Users, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden gradient-hero">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Limited Time Offer — 50% Off
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              AI DigiProfit{" "}
              <span className="text-gradient">Income Engine</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Build AI-powered WordPress eCommerce stores and scale to $20K/month 
              with secret traffic sources. The only course you need to escape the 9-to-5.
            </p>

            <div className="space-y-3 mb-8 animate-fade-up" style={{ animationDelay: "0.25s" }}>
              {["10 comprehensive modules with 50+ video lessons", "Secret traffic sources most marketers don't know", "Lifetime access with free updates"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-muted-foreground justify-center lg:justify-start">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground font-semibold text-lg px-8 shadow-soft hover:shadow-hover transition-all"
                onClick={() => navigate(user ? "/course" : "/auth")}
              >
                Enroll Now — $497
              </Button>
              <Button size="lg" variant="outline" className="font-semibold text-lg gap-2 group" onClick={() => document.getElementById("curriculum")?.scrollIntoView({ behavior: "smooth" })}>
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                View Curriculum
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">2,847+ students</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-foreground">5.0</span>
                <span className="text-sm text-muted-foreground">(127 reviews)</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-card">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-soft">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl p-4 shadow-card border border-border animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                    <Shield className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">30-Day Guarantee</p>
                    <p className="text-sm text-muted-foreground">100% money back</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
