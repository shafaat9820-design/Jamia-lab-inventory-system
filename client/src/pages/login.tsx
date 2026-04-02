import jamiaLogo from "@/assets/jamia-logo.png";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid institutional email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(3, "Full name is required (min 3 chars)."),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await login(data);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || "Invalid credentials. Please try again.",
      });
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      await register(data);
      toast({
        title: "Registration Successful",
        description: "Your account request has been sent for Admin approval.",
      });
      setIsRegisterMode(false);
      registerForm.reset();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.message || "Could not create account. Please try again.",
      });
    }
  };

  const activeForm = isRegisterMode ? registerForm : loginForm;
  const isSubmitting = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#0a1f0f]">
      {/* LEFT PANEL – Institutional Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden p-12">
        <div className="absolute inset-0">
          <img
            src="/jamia.png"
            alt="Jamia Millia Islamia"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a12]/95 via-[#0d3318]/80 to-[#1a5a28]/70" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="p-2.5 bg-white rounded-xl shadow-xl">
              <img src={jamiaLogo} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Established 1920</p>
              <h1 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Jamia Millia Islamia
              </h1>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
                Central University · New Delhi
              </p>
              <h2 className="text-5xl font-black text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Lab Asset &<br />Resource Portal
              </h2>
            </div>
            <p className="text-white/60 text-lg leading-relaxed max-w-md font-light">
              Comprehensive inventory tracking, equipment lifecycle management, and condemnation workflow for the Department of Computer Engineering, University Polytechnic.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Equipment Tracked", value: "500+" },
              { label: "Active Labs", value: "12" },
              { label: "Staff Users", value: "45+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black text-yellow-400">{stat.value}</p>
                <p className="text-white/50 text-xs font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL – Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1a5a28] via-yellow-400 to-[#1a5a28]" />

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-4">
            <img src={jamiaLogo} alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-[#1a5a28]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Jamia Millia Islamia
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Lab Asset Portal</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {isRegisterMode ? "Staff Registration" : "Portal Login"}
            </h2>
            <p className="text-muted-foreground mt-2 font-medium">
              {isRegisterMode
                ? "Apply for a new staff account."
                : "Sign in to manage institutional resources."}
            </p>
          </div>

          <form 
            onSubmit={isRegisterMode ? registerForm.handleSubmit(onRegisterSubmit) : loginForm.handleSubmit(onLoginSubmit)} 
            className="space-y-5"
          >
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-foreground uppercase tracking-tight">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...registerForm.register("name")}
                    placeholder="Prof. Mohammad Ali"
                    className={`pl-10 h-12 border-border/80 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all ${registerForm.formState.errors.name ? 'border-red-500 bg-red-50/30' : ''}`}
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground uppercase tracking-tight">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...(isRegisterMode ? registerForm.register("email") : loginForm.register("email"))}
                  type="email"
                  placeholder="name@jmi.ac.in"
                  className={`pl-10 h-12 border-border/80 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all ${activeForm.formState.errors.email ? 'border-red-500 bg-red-50/30' : ''}`}
                />
              </div>
              {activeForm.formState.errors.email && (
                <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {activeForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground uppercase tracking-tight">Institutional Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...(isRegisterMode ? registerForm.register("password") : loginForm.register("password"))}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`pl-10 pr-12 h-12 border-border/80 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all ${activeForm.formState.errors.password ? 'border-red-500 bg-red-50/30' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {activeForm.formState.errors.password && (
                <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {activeForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold rounded-xl bg-[#1a5a28] hover:bg-[#143f1c] text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <span>{isRegisterMode ? "Create Account" : "Access Portal"}</span>
              {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </Button>

            <div className="relative flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Institutional Access</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-2 font-bold hover:bg-muted/50 transition-all flex items-center justify-center gap-3"
              onClick={() => { window.location.href = "/api/auth/google"; }}
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Institutional Sign-In (Google)
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(!isRegisterMode); activeForm.reset(); }}
              className="text-sm font-bold text-primary hover:underline underline-offset-4 transition-all"
            >
              {isRegisterMode ? "Already a staff member? Sign In" : "New faculty or staff? Register Here"}
            </button>
          </div>

          {!isRegisterMode && (
            <p className="text-center text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest leading-relaxed">
              Authorized personnel only. JMI IT Security Policy applies.
            </p>
          )}
          
          {isRegisterMode && (
            <div className="flex items-start gap-4 p-5 bg-[#0a2a12]/5 border border-[#0a2a12]/10 rounded-2xl shadow-sm">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-primary/80 font-bold leading-relaxed">
                Applications are reviewed by the <span className="text-primary underline">Department Admin</span>. Approval may take 1-2 working days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}