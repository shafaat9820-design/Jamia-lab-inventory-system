import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileFormProps {
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<UpdateProfileRequest>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      age: user?.age || 18,
      gender: (user?.gender as any) || "Male",
      employeeId: user?.employeeId || "",
      contactNumber: user?.contactNumber || "",
      dateOfJoining: user?.dateOfJoining ? new Date(user.dateOfJoining).toISOString().split('T')[0] : "",
      profileImage: user?.profileImage || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const res = await fetch(api.profile.update.path, {
        method: api.profile.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum size is 2MB" });
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    setIsUploading(true);
    try {
      const res = await fetch(api.profile.upload.path, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      form.setValue("profileImage", url);
      toast({ title: "Image Uploaded", description: "Profile picture updated." });
    } catch (err) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload image." });
    } finally {
      setIsUploading(false);
    }
  };

  const initials = (user?.name || "User").split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-8">
      <div className="flex flex-col items-center gap-4 pb-6 border-b">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-muted">
            <AvatarImage src={form.watch("profileImage")} />
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <Camera className="text-white w-8 h-8" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
              <Loader2 className="animate-spin text-white w-8 h-8" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Change Profile Picture</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input {...form.register("firstName")} placeholder="Enter first name" />
          {form.formState.errors.firstName && (
            <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input {...form.register("lastName")} placeholder="Enter last name" />
          {form.formState.errors.lastName && (
            <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Age</Label>
          <Input type="number" {...form.register("age")} />
          {form.formState.errors.age && (
            <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select onValueChange={(v) => form.setValue("gender", v as any)} defaultValue={form.getValues("gender")}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Employee ID</Label>
          <Input {...form.register("employeeId")} placeholder="JMI-EMP-0001" />
          {form.formState.errors.employeeId && (
            <p className="text-xs text-destructive">{form.formState.errors.employeeId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Contact Number</Label>
          <Input {...form.register("contactNumber")} placeholder="10-digit number" />
          {form.formState.errors.contactNumber && (
            <p className="text-xs text-destructive">{form.formState.errors.contactNumber.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Date of Joining</Label>
          <Input type="date" {...form.register("dateOfJoining")} />
          {form.formState.errors.dateOfJoining && (
            <p className="text-xs text-destructive">{form.formState.errors.dateOfJoining.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="opacity-70">Email Address (Read Only)</Label>
          <Input value={user?.email || ""} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label className="opacity-70">Role (Read Only)</Label>
          <Input value={user?.role || ""} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label className="opacity-70">Department</Label>
          <Input value={user?.department || "University Polytechnic"} disabled className="bg-muted" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="submit" className="w-full md:w-auto px-8" disabled={updateMutation.isPending || isUploading}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
