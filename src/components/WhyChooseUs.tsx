import { Video, Clock, Infinity, Users, Gift, Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Video,
    title: "Expert-Led Video Courses",
    description: "Learn from industry professionals who have real-world experience and proven results.",
  },
  {
    icon: Clock,
    title: "Learn at Your Own Pace",
    description: "Access course materials anytime, anywhere. No deadlines, no pressure.",
  },
  {
    icon: Infinity,
    title: "Lifetime Access",
    description: "Once enrolled, you get permanent access to all course content and future updates.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Join a thriving community of like-minded learners and network with successful students.",
  },
  {
    icon: Gift,
    title: "Exclusive Bonuses",
    description: "Get access to premium toolkits, templates, and resources worth thousands of dollars.",
  },
  {
    icon: Headphones,
    title: "Priority Support",
    description: "Get your questions answered quickly with our dedicated student support team.",
  },
];

const WhyChooseUs = () => {
  return (
    <section id="about" className="py-16 lg:py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <Badge variant="secondary" className="mb-4 text-primary font-medium">
            Why Choose Xenlogy
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            The Platform Built for
            <span className="text-gradient"> Your Success</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We're not just another online course platform. We're your partner in building a 
            sustainable digital income. Here's what makes us different.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 lg:p-8 border border-border shadow-card hover:shadow-hover transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
