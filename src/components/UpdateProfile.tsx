import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  name: string;
  age: string;
  housing_situation: string;
  immediate_needs: string[];
  housing_search_type: string;
  health_concerns: string;
  health_details: string;
  education: string;
  disabilities: string;
  disability_details: string;
  additional_info: string;
  housing_application_opt_in: boolean;
  sex_offender_registry: boolean;
  where_sleep_frequently: string;
  homeless_over_year: boolean;
  household_pregnant: boolean;
  has_children: boolean;
  children_under_five: boolean;
  has_custody: boolean;
  custody_requires_housing: boolean;
  single_parent_household: boolean;
  foster_care_after_16: boolean;
  household_disability: boolean;
  housing_accommodations: string[];
  adults_independent_care: boolean;
  monthly_income: string;
  has_housing_voucher: boolean;
  poor_credit_prevented_housing: boolean;
  eviction_past_seven_years: boolean;
  justice_system_prevented_housing: boolean;
  immigration_status_prevented_housing: boolean;
  has_trusted_contacts: boolean;
  physical_health_crisis: boolean;
  mental_health_crisis: boolean;
  violence_trauma: boolean;
}

interface UpdateProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateProfile({ open, onOpenChange }: UpdateProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to update your profile");
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setProfileData({
          name: profile.name || "",
          age: profile.age || "",
          housing_situation: profile.housing_situation || "",
          immediate_needs: profile.immediate_needs || [],
          housing_search_type: profile.housing_search_type || "",
          health_concerns: profile.health_concerns || "",
          health_details: profile.health_details || "",
          education: profile.education || "",
          disabilities: profile.disabilities || "",
          disability_details: profile.disability_details || "",
          additional_info: profile.additional_info || "",
          housing_application_opt_in: profile.housing_application_opt_in || false,
          sex_offender_registry: profile.sex_offender_registry || false,
          where_sleep_frequently: profile.where_sleep_frequently || "",
          homeless_over_year: profile.homeless_over_year || false,
          household_pregnant: profile.household_pregnant || false,
          has_children: profile.has_children || false,
          children_under_five: profile.children_under_five || false,
          has_custody: profile.has_custody || false,
          custody_requires_housing: profile.custody_requires_housing || false,
          single_parent_household: profile.single_parent_household || false,
          foster_care_after_16: profile.foster_care_after_16 || false,
          household_disability: profile.household_disability || false,
          housing_accommodations: profile.housing_accommodations || [],
          adults_independent_care: profile.adults_independent_care || false,
          monthly_income: profile.monthly_income || "",
          has_housing_voucher: profile.has_housing_voucher || false,
          poor_credit_prevented_housing: profile.poor_credit_prevented_housing || false,
          eviction_past_seven_years: profile.eviction_past_seven_years || false,
          justice_system_prevented_housing: profile.justice_system_prevented_housing || false,
          immigration_status_prevented_housing: profile.immigration_status_prevented_housing || false,
          has_trusted_contacts: profile.has_trusted_contacts || false,
          physical_health_crisis: profile.physical_health_crisis || false,
          mental_health_crisis: profile.mental_health_crisis || false,
          violence_trauma: profile.violence_trauma || false,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to update your profile");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const toggleNeed = (need: string) => {
    setProfileData(prev => ({
      ...prev,
      immediate_needs: prev.immediate_needs?.includes(need)
        ? prev.immediate_needs.filter(n => n !== need)
        : [...(prev.immediate_needs || []), need]
    }));
  };

  const toggleAccommodation = (accommodation: string) => {
    setProfileData(prev => ({
      ...prev,
      housing_accommodations: prev.housing_accommodations?.includes(accommodation)
        ? prev.housing_accommodations.filter(a => a !== accommodation)
        : [...(prev.housing_accommodations || []), accommodation]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Update Your Profile</DialogTitle>
        </DialogHeader>

        <Alert className="bg-primary/10 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Fill in your profile for the best user experience and recommendations
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={profileData.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder={!profileData.name ? "Please provide your name" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profileData.age || ""}
                  onChange={(e) => updateField("age", e.target.value)}
                  placeholder={!profileData.age ? "Your age helps us find age-specific programs" : ""}
                />
              </div>
            </div>

            {/* Housing Situation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Housing Situation</h3>
              
              <div className="space-y-2">
                <Label>Current Housing Situation</Label>
                <Select
                  value={profileData.housing_situation || ""}
                  onValueChange={(value) => updateField("housing_situation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!profileData.housing_situation ? "Please select your current situation" : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shelter">Emergency shelter</SelectItem>
                    <SelectItem value="friends-family">Staying with friends/family temporarily</SelectItem>
                    <SelectItem value="streets-car">On the streets or in a car</SelectItem>
                    <SelectItem value="transitional">Transitional housing</SelectItem>
                    <SelectItem value="unstable">Have housing but it's unstable</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Housing Search Type</Label>
                <RadioGroup
                  value={profileData.housing_search_type || ""}
                  onValueChange={(value) => updateField("housing_search_type", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EMERGENCY" id="emergency" />
                    <Label htmlFor="emergency">Emergency / unsafe living environment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PREVENTATIVE" id="preventative" />
                    <Label htmlFor="preventative">Preventative (at risk of homelessness)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STABLE" id="stable" />
                    <Label htmlFor="stable">Looking for stable housing</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Where do you sleep most frequently?</Label>
                <Textarea
                  value={profileData.where_sleep_frequently || ""}
                  onChange={(e) => updateField("where_sleep_frequently", e.target.value)}
                  placeholder={!profileData.where_sleep_frequently ? "This helps us understand your current situation" : ""}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Monthly Income</Label>
                <Input
                  value={profileData.monthly_income || ""}
                  onChange={(e) => updateField("monthly_income", e.target.value)}
                  placeholder={!profileData.monthly_income ? "This helps us find programs you qualify for" : ""}
                />
              </div>
            </div>

            {/* Immediate Needs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Immediate Needs</h3>
              <p className="text-sm text-muted-foreground">
                {!profileData.immediate_needs || profileData.immediate_needs.length === 0 
                  ? "Select what you need most right now"
                  : "Update what you need most"}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Safe place to sleep",
                  "Food or meals",
                  "Medical care",
                  "Mental health support",
                  "Clothing or hygiene items",
                  "Help with school",
                  "Job or job training",
                  "Legal help",
                  "ID or important documents",
                ].map((need) => (
                  <div key={need} className="flex items-center space-x-2">
                    <Checkbox
                      id={need}
                      checked={profileData.immediate_needs?.includes(need)}
                      onCheckedChange={() => toggleNeed(need)}
                    />
                    <Label htmlFor={need} className="text-sm">{need}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Health & Wellness</h3>
              
              <div className="space-y-2">
                <Label>Health Concerns</Label>
                <RadioGroup
                  value={profileData.health_concerns || ""}
                  onValueChange={(value) => updateField("health_concerns", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="health-yes" />
                    <Label htmlFor="health-yes">Yes, I'd like to share more</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="health-no" />
                    <Label htmlFor="health-no">No, not right now</Label>
                  </div>
                </RadioGroup>
              </div>

              {profileData.health_concerns === "yes" && (
                <div className="space-y-2">
                  <Label>Health Details</Label>
                  <Textarea
                    value={profileData.health_details || ""}
                    onChange={(e) => updateField("health_details", e.target.value)}
                    placeholder={!profileData.health_details ? "Share what you're comfortable with..." : ""}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Disabilities</Label>
                <RadioGroup
                  value={profileData.disabilities || ""}
                  onValueChange={(value) => updateField("disabilities", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="disability-yes" />
                    <Label htmlFor="disability-yes">Yes, I'd like to share more</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="disability-no" />
                    <Label htmlFor="disability-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {profileData.disabilities === "yes" && (
                <div className="space-y-2">
                  <Label>Disability Details</Label>
                  <Textarea
                    value={profileData.disability_details || ""}
                    onChange={(e) => updateField("disability_details", e.target.value)}
                    placeholder={!profileData.disability_details ? "This helps us find specific resources..." : ""}
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Education</h3>
              
              <div className="space-y-2">
                <Label>Education Status</Label>
                <Select
                  value={profileData.education || ""}
                  onValueChange={(value) => updateField("education", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!profileData.education ? "Where are you at with school?" : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="currently-in-school">Currently in school</SelectItem>
                    <SelectItem value="left-want-back">Left school but want to go back</SelectItem>
                    <SelectItem value="graduated">Graduated high school</SelectItem>
                    <SelectItem value="working-ged">Working on GED</SelectItem>
                    <SelectItem value="not-interested">Not interested right now</SelectItem>
                    <SelectItem value="prefer-not-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Housing Accommodations */}
            {profileData.household_disability && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Housing Accommodations</h3>
                <p className="text-sm text-muted-foreground">
                  {!profileData.housing_accommodations || profileData.housing_accommodations.length === 0
                    ? "Select any accommodations you need"
                    : "Update your accommodation needs"}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "First floor or one story",
                    "No stairs",
                    "Wide door frames",
                    "Support bars in bathroom and shower",
                    "Roll-in shower",
                    "Low sinks",
                  ].map((accommodation) => (
                    <div key={accommodation} className="flex items-center space-x-2">
                      <Checkbox
                        id={accommodation}
                        checked={profileData.housing_accommodations?.includes(accommodation)}
                        onCheckedChange={() => toggleAccommodation(accommodation)}
                      />
                      <Label htmlFor={accommodation} className="text-sm">{accommodation}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              
              <div className="space-y-2">
                <Label>Anything else you'd like to share?</Label>
                <Textarea
                  value={profileData.additional_info || ""}
                  onChange={(e) => updateField("additional_info", e.target.value)}
                  placeholder={!profileData.additional_info ? "Share anything else that might help us assist you better..." : ""}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
