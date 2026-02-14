import { useEffect, useState } from "react";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [price, setPrice] = useState("497");
  const [originalPrice, setOriginalPrice] = useState("997");

  useEffect(() => {
    supabase.from("site_settings").select("key, value").in("key", ["course_price", "course_original_price"]).then(({ data }) => {
      (data || []).forEach((s) => {
        if (s.key === "course_price") setPrice(s.value);
        if (s.key === "course_original_price") setOriginalPrice(s.value);
      });
    });
  }, []);

  return (
    <section className="py-16 lg:py-24 bg-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 animate-float">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-background mb-6">
            Ready to Build Your
            <span className="block text-primary"> AI-Powered Income?</span>
          </h2>

          <p className="text-lg lg:text-xl text-background/70 max-w-2xl mx-auto mb-4">
            Start building a profitable AI-powered business today with our step-by-step course.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="font-display text-4xl font-bold text-background">${price}</span>
            {originalPrice && Number(originalPrice) > Number(price) && (
              <>
                <span className="text-xl text-background/50 line-through">${originalPrice}</span>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                  {Math.round((1 - Number(price) / Number(originalPrice)) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button 
              size="lg" 
              className="gradient-primary text-primary-foreground font-semibold text-lg px-8 shadow-soft hover:shadow-hover transition-all gap-2 group"
              onClick={() => navigate(user ? "/course" : "/auth")}
            >
              Enroll Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-background/60">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">30-Day Money Back Guarantee</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-background/40 hidden sm:block" />
            <span className="text-sm font-medium">Lifetime Access</span>
            <div className="w-1 h-1 rounded-full bg-background/40 hidden sm:block" />
            <span className="text-sm font-medium">Free Updates</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
