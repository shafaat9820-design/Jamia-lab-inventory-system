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

const registerSchema = z.object({
  name: z.string().min(3, "Full name is required (min 3 chars)."),
  email: z.string().email("Please enter a valid institutional email."),
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character."),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid institutional email."),
});

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character."),
  confirmPassword: z.string().min(8, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showConfirmPasswordReset, setShowConfirmPasswordReset] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [registrationData, setRegistrationData] = useState<RegisterFormValues | null>(null);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"request" | "otp" | "reset">("request");
  const [resetEmail, setResetEmail] = useState("");
  
  const { 
    login, register, isLoggingIn, isRegistering, 
    requestOTP, isRequestingOTP,
    verifyOTP, isVerifyingOTP,
    forgotPassword, isRequestingForgotPassword,
    resetPassword, isResettingPassword 
  } = useAuth();
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

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
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
      setRegistrationData(data);
      await requestOTP(data);
      setIsOtpMode(true);
      toast({
        title: "OTP Sent",
        description: `A 6-digit verification code has been sent to ${data.email}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "OTP Request Failed",
        description: err.message || "Could not send verification code. Please try again.",
      });
    }
  };

  const onVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter a 6-digit verification code.",
      });
      return;
    }

    if (!registrationData) return;

    try {
      await verifyOTP({ email: registrationData.email, otp });
      toast({
        title: "Account Created Successfully",
        description: "Your email has been verified. Now you can login after Admin approval.",
      });
      setIsRegisterMode(false);
      setIsOtpMode(false);
      setOtp("");
      registerForm.reset();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.message || "Invalid or expired OTP. Please try again.",
      });
    }
  };

  const onForgotPasswordRequest = async (data: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(data.email);
      setResetEmail(data.email);
      setForgotPasswordStep("otp");
      setOtp("");
      toast({
        title: "OTP Sent",
        description: `A 6-digit reset code has been sent to ${data.email}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: err.message,
      });
    }
  };

  const onForgotPasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your email.",
      });
      return;
    }
    setForgotPasswordStep("reset");
  };

  const onResetPasswordSubmit = async (data: ResetPasswordFormValues) => {
    try {
      await resetPassword({ email: resetEmail, otp, password: data.password });
      toast({
        title: "Password Reset Successfully",
        description: "You can now login with your new password.",
      });
      setIsForgotPasswordMode(false);
      setForgotPasswordStep("request");
      setResetEmail("");
      setOtp("");
      resetPasswordForm.reset();
      forgotPasswordForm.reset();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: err.message,
      });
    }
  };

  const activeForm = isRegisterMode ? registerForm : loginForm;
  const isSubmitting = isLoggingIn || isRegistering || isRequestingOTP || isVerifyingOTP;

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
              Comprehensive inventory tracking, article lifecycle management, and condemnation workflow for the University Polytechnic.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Articles Tracked", value: "500+" },
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
              {isForgotPasswordMode 
                ? "Reset Password" 
                : (isRegisterMode ? "Staff Registration" : "Portal Login")}
            </h2>
            <p className="text-muted-foreground mt-2 font-medium">
              {isForgotPasswordMode
                ? (forgotPasswordStep === "request" ? "Request a password reset link." : "Complete the security verification.")
                : (isRegisterMode ? "Apply for a new staff account." : "Sign in to manage institutional resources.")}
            </p>
          </div>

          {isForgotPasswordMode ? (
            <div className="space-y-6">
              {forgotPasswordStep === "request" && (
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordRequest)} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground uppercase tracking-tight">Enter Your Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...forgotPasswordForm.register("email")}
                        type="email"
                        placeholder="name@jmi.ac.in"
                        className={`pl-10 h-12 border-border/80 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all ${forgotPasswordForm.formState.errors.email ? 'border-red-500 bg-red-50/30' : ''}`}
                      />
                    </div>
                    {forgotPasswordForm.formState.errors.email && (
                      <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {forgotPasswordForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg" disabled={isRequestingForgotPassword}>
                    {isRequestingForgotPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send Reset OTP <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPasswordMode(false)}
                    className="w-full text-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    ← Back to Login
                  </button>
                </form>
              )}

              {forgotPasswordStep === "otp" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Verify Security Code</p>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      We've sent a 6-digit reset code to <span className="text-foreground font-bold">{resetEmail}</span>.
                    </p>
                  </div>
                  <form onSubmit={onForgotPasswordVerify} className="space-y-5 text-center">
                    <Input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="h-16 text-center text-3xl font-black tracking-[0.5em] border-2 border-primary/20 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white shadow-inner transition-all"
                    />
                    <Button type="submit" className="w-full h-12 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg">
                      Verify Code <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setForgotPasswordStep("request")}
                      className="w-full text-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                    >
                      ← Back to Email
                    </button>
                  </form>
                </div>
              )}

              {forgotPasswordStep === "reset" && (
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground uppercase tracking-tight">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...resetPasswordForm.register("password")}
                        type={showPasswordReset ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-10 h-12 border-border/80 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all ${resetPasswordForm.formState.errors.password ? 'border-red-500 bg-red-50/30' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPasswordReset(!showPasswordReset)}
                      >
                        {showPasswordReset ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {resetPasswordForm.formState.errors.password && (
                      <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {resetPasswordForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-foreground uppercase tracking-tight">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...resetPasswordForm.register("confirmPassword")}
                        type={showConfirmPasswordReset ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-10 h-12 border-border/80 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all ${resetPasswordForm.formState.errors.confirmPassword ? 'border-red-500 bg-red-50/30' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPasswordReset(!showConfirmPasswordReset)}
                      >
                        {showConfirmPasswordReset ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {resetPasswordForm.formState.errors.confirmPassword && (
                      <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {resetPasswordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg" disabled={isResettingPassword}>
                    {isResettingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Password <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <form 
              onSubmit={
                isOtpMode 
                  ? onVerifyOtpSubmit 
                  : (isRegisterMode ? registerForm.handleSubmit(onRegisterSubmit) : loginForm.handleSubmit(onLoginSubmit))
              } 
              className="space-y-5"
            >
              {!isOtpMode ? (
                <>
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
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {activeForm.formState.errors.password && (
                      <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {activeForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {!isRegisterMode && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordMode(true);
                          setForgotPasswordStep("request");
                        }}
                        className="text-[11px] font-bold text-primary hover:underline underline-offset-4 uppercase tracking-wider"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Verify your email</p>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      We've sent a 6-digit code to <span className="text-foreground font-bold">{registrationData?.email}</span>. Please enter it below to complete your registration.
                    </p>
                  </div>

                  <div className="space-y-3 text-center">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">6-Digit Code</Label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="h-16 text-center text-3xl font-black tracking-[0.5em] border-2 border-primary/20 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white shadow-inner transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setIsOtpMode(false)}
                      className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                    >
                      ← Back to Details
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold rounded-xl bg-[#1a5a28] hover:bg-[#143f1c] text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group"
                disabled={isSubmitting || isVerifyingOTP}
              >
                {(isSubmitting || isVerifyingOTP) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                <span>
                  {isVerifyingOTP 
                    ? "Verifying..." 
                    : (isOtpMode 
                        ? "Verify & Create Account" 
                        : (isRegisterMode ? "Create Account" : "Access Portal"))}
                </span>
                {!(isSubmitting || isVerifyingOTP) && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>

            </form>
          )}

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