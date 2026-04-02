import { useAuth } from "@/hooks/use-auth";
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
  ArrowLeft,
  Shield
} from "lucide-react";
import { useLocation } from "wouter";
import { ProfileForm } from "@/components/profile-form";
import { useState, useEffect } from "react";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "true") {
      setIsEditing(true);
    }
  }, []);

  if (!user) return null;

  const initials = (user.name || "User")
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .join("")
    .toUpperCase();

  const infoItems = [
    { icon: Mail, label: "Email Address", value: user.email },
    { icon: IdCard, label: "Employee ID", value: user.employeeId || "Not set" },
    { icon: Phone, label: "Contact Number", value: user.contactNumber || "Not set" },
    { icon: Calendar, label: "Date of Joining", value: user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "Not set" },
    { icon: GraduationCap, label: "Age / Gender", value: `${user.age || "—"} / ${user.gender || "—"}` },
    { icon: Building2, label: "Department", value: user.department || "Department of Computer Engineering, University Polytechnic" },
  ];

  const roleBadgeColor: Record<string, string> = {
    Admin: "bg-red-100 text-red-700 border-red-200",
    Principal: "bg-purple-100 text-purple-700 border-purple-200",
    "Lab Incharge": "bg-blue-100 text-blue-700 border-blue-200",
    "Lab Assistant": "bg-green-100 text-green-700 border-green-200",
    "Store Keeper": "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              User Profile
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">
            Institutional personnel information and account settings.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => isEditing ? setIsEditing(false) : setLocation("/dashboard")}
          className="rounded-xl hover-elevate shrink-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isEditing ? "View Profile" : "Back to Dashboard"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Side Card */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden h-fit">
          {/* Card Header */}
          <div className="h-2 bg-gradient-to-r from-[#0d3318] via-yellow-400 to-[#1a5a28]" />
          <div className="flex flex-col items-center text-center px-6 py-8">
            <div className="relative mb-5">
              <Avatar className="h-28 w-28 border-4 border-primary/10 shadow-xl">
                <AvatarImage src={user.profileImage || undefined} />
                <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-[#0d3318] to-[#1a5a28] text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full text-white shadow-lg hover:bg-primary/90 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <h3 className="text-xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {user.name}
            </h3>
            <Badge
              variant="outline"
              className={`mt-2 px-3 py-1 text-xs font-black uppercase tracking-widest border ${roleBadgeColor[user.role] || "bg-primary/5 text-primary border-primary/20"}`}
            >
              {user.role}
            </Badge>

            <div className="mt-6 w-full pt-6 border-t space-y-2 text-sm text-muted-foreground font-medium">
              <p className="flex items-center justify-center gap-2">
                <Building2 className="w-4 h-4 text-primary/60" />
                Jamia Millia Islamia
              </p>
              <p className="flex items-center justify-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary/60" />
                Dept. of Computer Engineering
              </p>
            </div>

            {/* Access Level */}
            <div className="mt-5 w-full p-3 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2 justify-center text-xs font-bold text-primary uppercase tracking-widest">
                <Shield className="w-3.5 h-3.5" />
                {user.isApproved === "true" ? "Approved Access" : "Pending Approval"}
              </div>
            </div>

            {!isEditing && (
              <Button
                className="w-full mt-5 rounded-xl font-bold shadow-md hover-elevate"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Details / Form Card */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden col-span-1 lg:col-span-2">
          <div className="px-8 py-6 border-b bg-muted/20 flex items-center gap-3">
            {isEditing ? <Edit3 className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
            <div>
              <h3 className="font-black text-foreground text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                {isEditing ? "Update Profile Information" : "Personal Information"}
              </h3>
              <p className="text-muted-foreground text-sm font-medium mt-0.5">
                {isEditing
                  ? "Update your personal and professional details."
                  : "Official institutional records for the Department of Computer Engineering."}
              </p>
            </div>
          </div>
          <div className="p-8">
            {isEditing ? (
              <ProfileForm onSuccess={() => setIsEditing(false)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
                {infoItems.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 group">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </div>
                    <div className="pb-2 border-b border-transparent group-hover:border-primary/20 transition-all">
                      <p className="text-base font-bold text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
