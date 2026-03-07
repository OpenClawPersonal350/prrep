import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, Upload, User, Mail, Phone, Building, Globe, MessageSquare, Clock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, updateProfile, getUser, apiService } from "@/lib/api";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  
  // User Profile Section
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // AI Settings Section
  const [restaurantName, setRestaurantName] = useState("");
  const [brandTone, setBrandTone] = useState("professional");
  const [emojiAllowed, setEmojiAllowed] = useState(true);
  const [replyMode, setReplyMode] = useState("manual");
  const [replyDelayMinutes, setReplyDelayMinutes] = useState("60");

  useEffect(() => {
    fetchProfile();
    
    const handleProfileUpdate = () => {
      const updatedUser = getUser();
      if (updatedUser) {
        setAvatarUrl(updatedUser.avatarUrl || "");
      }
    };
    window.addEventListener('user_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('user_profile_updated', handleProfileUpdate);
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getProfile();
      
      if (response.success) {
        // User Profile fields
        if (response.name !== undefined) setName(response.name);
        if (response.email !== undefined) setEmail(response.email);
        if (response.phoneNumber !== undefined) setPhoneNumber(response.phoneNumber || "");
        if (response.businessName !== undefined) setBusinessName(response.businessName || "");
        if (response.timezone !== undefined) setTimezone(response.timezone || "UTC");
        if (response.avatarUrl !== undefined) setAvatarUrl(response.avatarUrl);

        // AI Settings fields
        if (response.restaurantName !== undefined) setRestaurantName(response.restaurantName || "");
        if (response.brandTone !== undefined) setBrandTone(response.brandTone || "professional");
        if (response.emojiAllowed !== undefined) setEmojiAllowed(response.emojiAllowed);
        if (response.replyMode !== undefined) setReplyMode(response.replyMode || "manual");
        if (response.replyDelayMinutes !== undefined) setReplyDelayMinutes(response.replyDelayMinutes?.toString() || "60");
      }
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateProfile({
        // User Profile fields
        name,
        phoneNumber: phoneNumber || null,
        businessName: businessName || null,
        timezone,
        // AI Settings fields
        restaurantName,
        brandTone: brandTone as "casual" | "professional" | "friendly",
        emojiAllowed,
        replyMode: replyMode as "auto" | "manual",
        replyDelayMinutes: parseInt(replyDelayMinutes) || 0,
      });

      if (response.success) {
        setSuccess("Settings saved successfully!");
        
        // Update local user state
        const currentUser = getUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, name, avatarUrl };
          localStorage.setItem('replycraft_user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('user_profile_updated'));
        }
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.profile || "Failed to save settings");
      }
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setCropImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setCropImageSrc(null);
      const response = await apiService.uploadAvatar(croppedBlob);
      
      if (response.success && response.fullAvatarUrl) {
        setAvatarUrl(response.fullAvatarUrl);
        toast({ title: "Avatar updated successfully" });
        
        // Update user in localStorage
        const currentUser = getUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, avatarUrl: response.fullAvatarUrl };
          localStorage.setItem('replycraft_user', JSON.stringify(updatedUser));
        }
      } else {
        toast({ variant: "destructive", title: "Failed to upload avatar" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to upload avatar", description: err.message });
    }
  };

  const getAvatarUrl = () => {
    if (!avatarUrl) return undefined;
    // If it's already a full URL, use it
    if (avatarUrl.startsWith('http')) return avatarUrl;
    // Otherwise, prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    return `${baseUrl}${avatarUrl}`;
  };

  const currentUser = { name, avatarUrl: getAvatarUrl(), email };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your profile and AI reply settings</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
            {success}
          </div>
        )}

        {/* SECTION 1: User Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <UserAvatar user={currentUser} className="w-24 h-24" />
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            {/* Phone Number */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Business Name */}
            <div className="grid gap-2">
              <Label htmlFor="business">Business Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="business"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Restaurant Name"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: AI Reply Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Reply Configuration
            </CardTitle>
            <CardDescription>Configure how AI generates replies to reviews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Restaurant Name */}
            <div className="grid gap-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Your restaurant name (used in AI replies)"
              />
            </div>

            {/* Brand Tone */}
            <div className="grid gap-2">
              <Label htmlFor="brandTone">Brand Tone</Label>
              <Select value={brandTone} onValueChange={setBrandTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Emoji Allowed */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="emojiAllowed">Allow Emojis</Label>
                <p className="text-sm text-muted-foreground">Include emojis in AI-generated replies</p>
              </div>
              <Switch
                id="emojiAllowed"
                checked={emojiAllowed}
                onCheckedChange={setEmojiAllowed}
              />
            </div>

            {/* Reply Mode */}
            <div className="grid gap-2">
              <Label htmlFor="replyMode">Reply Mode</Label>
              <Select value={replyMode} onValueChange={setReplyMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual - Review before sending</SelectItem>
                  <SelectItem value="auto">Auto - Send immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reply Delay */}
            <div className="grid gap-2">
              <Label htmlFor="replyDelay">Reply Delay (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="replyDelay"
                  type="number"
                  min="0"
                  max="1440"
                  value={replyDelayMinutes}
                  onChange={(e) => setReplyDelayMinutes(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">Delay before sending auto-replies (0 for immediate)</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gradient-primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          src={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
};

export default SettingsPage;
