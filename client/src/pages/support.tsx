import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, MessageSquare, Clock, Send, HelpCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";

export default function Support() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "We've received your query and will get back to you shortly.",
      });
      setIsSubmitting(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  const contactItems = [
    {
      icon: Phone,
      label: "Call Us",
      value: "828066*****",
      sub: "Mon – Fri, 9:00 AM – 5:30 PM",
      href: "tel:8280660000",
    },
    {
      icon: Mail,
      label: "Email Us",
      value: "jmi.lab.inventory@gmail.com",
      sub: "Expect a reply within 24 hours",
      href: "mailto:jmi.lab.inventory@gmail.com",
    },
    {
      icon: MapPin,
      label: "Our Location",
      value: "Dept. of Computer Engineering",
      sub: "Jamia Millia Islamia, New Delhi",
      href: "#",
    },
    {
      icon: Clock,
      label: "Working Hours",
      value: "Mon – Fri: 9 AM – 5:30 PM",
      sub: "Closed on weekends & public holidays",
      href: "#",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Support & Help Center
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">
            Have questions about the system? We're here to help.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="space-y-4 lg:col-span-1">
          {/* Contact Cards */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b bg-muted/20">
              <h3 className="font-black text-foreground text-base">Contact Information</h3>
              <p className="text-muted-foreground text-sm font-medium mt-0.5">
                Reach us through any of these channels.
              </p>
            </div>
            <div className="divide-y divide-border">
              {contactItems.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="flex items-start gap-4 px-6 py-5 group hover:bg-muted/30 transition-colors"
                >
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                      {item.label}
                    </p>
                    <p className="font-bold text-foreground text-sm truncate">{item.value}</p>
                    <p className="text-xs text-muted-foreground/60 font-medium mt-0.5">{item.sub}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Quick FAQ Card */}
          <div className="bg-gradient-to-br from-[#0d3318] to-[#1a5a28] rounded-2xl shadow-xl overflow-hidden border-none relative">
            <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="p-6 relative z-10 space-y-3">
              <div className="p-2.5 bg-white/15 rounded-xl w-fit">
                <MessageSquare className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-1">Quick Help</p>
                <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  User Guidelines
                </h3>
                <p className="text-sm text-white/60 font-medium leading-relaxed mt-1">
                  Find instant answers in the system guidelines document.
                </p>
              </div>
              <Link href="/guidelines">
                <button className="w-full flex items-center justify-center gap-2 font-bold px-4 py-2.5 bg-yellow-400 text-[#0d3318] rounded-xl hover:bg-yellow-300 transition-all text-sm">
                  <ExternalLink className="w-4 h-4" />
                  View Guidelines
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b bg-muted/20">
            <h3 className="font-black text-foreground text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Send a Message
            </h3>
            <p className="text-muted-foreground text-sm font-medium mt-0.5">
              Fill out the form below and our team will respond within 24 hours.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  className="h-11 rounded-xl border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@jmi.ac.in"
                  className="h-11 rounded-xl border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="What do you need help with?"
                className="h-11 rounded-xl border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Describe your query in detail..."
                className="min-h-[150px] rounded-xl border-border/70 resize-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 w-4 h-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
