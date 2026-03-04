import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  IdCard, 
  Phone, 
  Calendar, 
  Building2, 
  GraduationCap,
  Edit3,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { ProfileForm } from "@/components/profile-form";
import { useState, useEffect } from "react";

export default function Profile() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "true") {
      setIsEditing(true);
    }
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const infoItems = [
    { icon: Mail, label: "Email Address", value: user.username },
    { icon: IdCard, label: "Employee ID", value: user.employeeId || "Not set" },
    { icon: Phone, label: "Contact Number", value: user.contactNumber || "Not set" },
    { icon: Calendar, label: "Date of Joining", value: user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : "Not set" },
    { icon: GraduationCap, label: "Age / Gender", value: `${user.age || "?"} / ${user.gender || "?"}` },
    { icon: Building2, label: "Department", value: user.department || "Department of Computer Engineering" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">User Profile</h2>
          <p className="text-muted-foreground mt-1">Institutional personnel information and settings.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => isEditing ? setIsEditing(false) : setLocation("/dashboard")}
          className="hover-elevate"
        >
          {isEditing ? <><ArrowLeft className="mr-2 h-4 w-4" /> View Profile</> : <><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="col-span-1 shadow-xl border-t-4 border-t-primary h-fit">
          <CardContent className="pt-8 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 border-4 border-primary/10 mb-4 shadow-lg">
              <AvatarImage src={user.profileImage || undefined} />
              <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-2xl font-bold text-foreground">{user.name}</h3>
            <Badge variant="outline" className="mt-2 bg-primary/5 text-primary border-primary/20 px-3 py-1 text-sm font-semibold uppercase tracking-wider">
              {user.role}
            </Badge>
            <div className="mt-6 w-full pt-6 border-t space-y-2 text-sm text-muted-foreground font-medium">
              <p className="flex items-center justify-center gap-2">
                <Building2 className="w-4 h-4" /> Jamia Millia Islamia
              </p>
              <p className="flex items-center justify-center gap-2">
                <GraduationCap className="w-4 h-4" /> Dept. of Computer Engineering
              </p>
            </div>
            {!isEditing && (
              <Button 
                className="w-full mt-8 shadow-md hover-elevate" 
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Details / Form Card */}
        <Card className="col-span-1 lg:col-span-2 shadow-xl">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="font-display text-xl flex items-center gap-2 text-primary">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <User className="w-5 h-5" />}
              {isEditing ? "Update Profile Information" : "Personal Information"}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? "Update your personal and professional details. Some fields are institutional defaults." 
                : "Official institutional records for the Department of Computer Engineering."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            {isEditing ? (
              <ProfileForm onSuccess={() => setIsEditing(false)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {infoItems.map((item, idx) => (
                  <div key={idx} className="space-y-1 group">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <p className="text-lg font-semibold text-foreground border-b border-transparent group-hover:border-primary/20 pb-1 transition-all">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
