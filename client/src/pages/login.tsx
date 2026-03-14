import jamiaLogo from "@/assets/jamia-logo.png";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { University, Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Lab Assistant");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // email validation
  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    try {
      if (isRegisterMode) {
        await register({ email, password, name, role });
        toast({
          title: "Account Created",
          description: "Your account has been successfully created.",
        });
      } else {
        await login({ email, password });
      }

      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: isRegisterMode ? "Registration Failed" : "Login Failed",
        description: err.message,
      });
    }
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google Login",
      description: "Google authentication will be added soon.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 relative overflow-hidden">
      {/* background blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary z-10">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <img
              src={jamiaLogo}
              alt="Jamia Millia Islamia"
              className="h-20 w-auto"
            />
          </div>

          <CardTitle className="text-3xl font-display">
            Jamia Millia Islamia
          </CardTitle>

          <CardDescription className="text-base font-medium">
            Lab Inventory & Condemnation Management
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {isRegisterMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="py-6 text-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="py-6 text-md">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Lab Assistant">
                        Lab Assistant
                      </SelectItem>
                      <SelectItem value="Lab Incharge">
                        Lab Incharge
                      </SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Store Keeper">
                        Store Keeper
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="py-6 text-md"
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="py-6 text-md pr-12"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button
              type="submit"
              className="w-full py-6 text-md font-semibold"
              disabled={isLoggingIn || isRegistering}
            >
              {isRegisterMode
                ? isRegistering
                  ? "Creating Account..."
                  : "Create Account"
                : isLoggingIn
                ? "Authenticating..."
                : "Log In"}
            </Button>

            {/* GOOGLE BUTTON */}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                window.location.href = "/api/auth/google";
              }}
            >
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="link"
              className="text-primary font-semibold"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
            >
              {isRegisterMode
                ? "Already have an account? Log In"
                : "Don't have an account? Create one"}
            </Button>

            
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}