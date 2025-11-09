import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Heart, AlertTriangle, Pause, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type FormData = {
  name: string;
  age: string;
  housingSituation: string;
  immediateNeeds: string[];
  housingSearchType: string;
  healthConcerns: string;
  healthDetails: string;
  education: string;
  disabilities: string;
  disabilityDetails: string;
  additionalInfo: string;
  housingApplicationOptIn: string;
  sexOffenderRegistry: string;
  whereSleepFrequently: string;
  homelessOverYear: string;
  householdPregnant: string;
  hasChildren: string;
  childrenUnderFive: string;
  hasCustody: string;
  custodyRequiresHousing: string;
  singleParentHousehold: string;
  fosterCareAfter16: string;
  householdDisability: string;
  housingAccommodations: string[];
  adultsIndependentCare: string;
  monthlyIncome: string;
  hasHousingVoucher: string;
  poorCreditPreventedHousing: string;
  evictionPastSevenYears: string;
  justiceSystemPreventedHousing: string;
  immigrationStatusPreventedHousing: string;
  hasTrustedContacts: string;
  physicalHealthCrisis: string;
  mentalHealthCrisis: string;
  violenceTrauma: string;
};

interface IntakeFormProps {
  onComplete: (data: FormData) => void;
}

export default function IntakeForm({ onComplete }: IntakeFormProps) {
  const [step, setStep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    housingSituation: "",
    immediateNeeds: [],
    housingSearchType: "",
    healthConcerns: "",
    healthDetails: "",
    education: "",
    disabilities: "",
    disabilityDetails: "",
    additionalInfo: "",
    housingApplicationOptIn: "",
    sexOffenderRegistry: "",
    whereSleepFrequently: "",
    homelessOverYear: "",
    householdPregnant: "",
    hasChildren: "",
    childrenUnderFive: "",
    hasCustody: "",
    custodyRequiresHousing: "",
    singleParentHousehold: "",
    fosterCareAfter16: "",
    householdDisability: "",
    housingAccommodations: [],
    adultsIndependentCare: "",
    monthlyIncome: "",
    hasHousingVoucher: "",
    poorCreditPreventedHousing: "",
    evictionPastSevenYears: "",
    justiceSystemPreventedHousing: "",
    immigrationStatusPreventedHousing: "",
    hasTrustedContacts: "",
    physicalHealthCrisis: "",
    mentalHealthCrisis: "",
    violenceTrauma: "",
  });

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("haven_form_progress");
    if (savedProgress) {
      const { step: savedStep, data } = JSON.parse(savedProgress);
      setStep(savedStep);
      setFormData(data);
      toast.info("Welcome back! Your progress has been restored.");
    }
  }, []);

  // Save progress when form data or step changes
  useEffect(() => {
    if (step > 1) {
      localStorage.setItem(
        "haven_form_progress",
        JSON.stringify({
          step: step,
          data: formData,
        }),
      );
    }
  }, [step, formData]);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    // Skip housing application questions if user opted out
    if (step === 6 && formData.housingApplicationOptIn === "no") {
      setStep(29); // Jump to health questions
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    // Skip housing application questions if user opted out
    if (step === 6 && formData.housingApplicationOptIn === "no") {
      setStep(29); // Jump to health questions
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    // If coming back from health questions (step 29) and user had opted out, go back to step 6
    if (step === 29 && formData.housingApplicationOptIn === "no") {
      setStep(6);
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const { saveProfile } = await import("@/lib/profileService");
      await saveProfile(formData);
      localStorage.removeItem("haven_form_progress"); // Clear saved progress
      toast.success("Thank you for sharing your story with us. We're here to help.");
      onComplete(formData);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("There was an error saving your information. Please try again.");
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    toast.info("Your progress has been saved. You can return anytime.");
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  // Steps that need content warnings (sensitive topics)
  const sensitiveSteps = [7, 8, 9, 14, 23, 24, 25, 26, 27, 28];
  const isSensitiveStep = sensitiveSteps.includes(step);

  // Calculate total steps and progress
  const totalSteps = formData.housingApplicationOptIn === "no" ? 11 : 33;
  const progressPercentage = (step / totalSteps) * 100;

  if (isPaused) {
    return (
      <div className="min-h-screen noise-overlay flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full p-8 space-y-6 bg-glass-bg/95 backdrop-blur-md border-2 border-glass-border rounded-lg text-center">
          <Pause className="w-16 h-16 mx-auto text-primary" />
          <h2 className="text-2xl font-semibold text-glass-text">Taking a Break</h2>
          <p className="text-muted-foreground">
            Your progress has been saved. Take all the time you need, and when you're ready, you can continue from where
            you left off, or skip ahead to view available resources.
          </p>
          <div className="space-y-3">
            <Button onClick={handleResume} className="w-full">
              Resume Application
            </Button>
            <Button
              onClick={async () => {
                try {
                  const { saveProfile } = await import("@/lib/profileService");
                  await saveProfile(formData);
                  localStorage.removeItem("haven_form_progress");
                  onComplete(formData);
                } catch (error) {
                  console.error("Error saving profile:", error);
                  toast.error("There was an error saving your information. Please try again.");
                }
              }}
              variant="outline"
              className="w-full"
            >
              Skip to Resources
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const toggleNeed = (need: string) => {
    setFormData((prev) => ({
      ...prev,
      immediateNeeds: prev.immediateNeeds.includes(need)
        ? prev.immediateNeeds.filter((n) => n !== need)
        : [...prev.immediateNeeds, need],
    }));
  };

  const toggleAccommodation = (accommodation: string) => {
    setFormData((prev) => ({
      ...prev,
      housingAccommodations: prev.housingAccommodations.includes(accommodation)
        ? prev.housingAccommodations.filter((a) => a !== accommodation)
        : [...prev.housingAccommodations, accommodation],
    }));
  };

  return (
    <div className="min-h-screen noise-overlay flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <Heart className="w-10 h-10 text-white fill-white drop-shadow-lg" />
          {step > 6 && (
            <Button variant="outline" size="sm" onClick={handlePause} className="gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8 space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-white/70 text-right">
            Step {step} of {totalSteps}
          </p>
        </div>

        {isSensitiveStep && (
          <Alert className="mb-6 bg-amber-50/90 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              The following questions cover sensitive topics. Feel free to skip any question or pause at any time.
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">Let's start with your name</h2>
              <p className="text-white/90 text-lg drop-shadow">
                What would you like us to call you? This can be your given name or any name you prefer.
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <Input
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Your name"
                className="text-lg h-12 text-center"
                autoFocus
              />
              <Button onClick={handleContinue} disabled={!formData.name.trim()} className="w-full h-12 text-lg">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">How old are you?</h2>
              <p className="text-white/90 text-lg drop-shadow">This helps us match you with age-specific programs.</p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => updateFormData("age", e.target.value)}
                placeholder="Your age"
                className="text-lg h-12 text-center"
                autoFocus
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Housing Situation */}
        {step === 3 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Where are you staying right now?
              </h2>
              <p className="text-white/90 text-lg drop-shadow">
                Understanding your current situation helps us connect you with the right support.
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.housingSituation}
                onValueChange={(value) => updateFormData("housingSituation", value)}
                className="space-y-3 text-left"
              >
                {[
                  { value: "shelter", label: "Emergency shelter" },
                  { value: "friends-family", label: "Staying with friends/family temporarily" },
                  { value: "streets-car", label: "On the streets or in a car" },
                  { value: "transitional", label: "Transitional housing" },
                  { value: "unstable", label: "Have housing but it's unstable" },
                  { value: "other", label: "Other" },
                  { value: "prefer-not-say", label: "Prefer not to say" },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Immediate Needs */}
        {step === 4 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                What do you need most right now?
              </h2>
              <p className="text-white/90 text-lg drop-shadow">
                Select all that apply. We'll prioritize resources based on what matters most to you.
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-3 text-left">
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
                  <div
                    key={need}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={need}
                      checked={formData.immediateNeeds.includes(need)}
                      onCheckedChange={() => toggleNeed(need)}
                    />
                    <Label htmlFor={need} className="flex-1 cursor-pointer text-base">
                      {need}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Housing Search Type */}
        {step === 5 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                How would you describe your current search for housing?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.housingSearchType}
                onValueChange={(value) => updateFormData("housingSearchType", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="EMERGENCY" id="emergency" />
                  <Label htmlFor="emergency" className="flex-1 cursor-pointer text-base">
                    I'm facing an emergency / unsafe living environment
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="PREVENTATIVE" id="preventative" />
                  <Label htmlFor="preventative" className="flex-1 cursor-pointer text-base">
                    I need help maintaining my housing situation
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="LONGTERM" id="longterm" />
                  <Label htmlFor="longterm" className="flex-1 cursor-pointer text-base">
                    I need long-term housing
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Housing Application Opt-In */}
        {step === 6 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Housing application information
              </h2>
              <p className="text-white/90 text-lg drop-shadow">
                Would you like to give more information for the purposes of filling out housing applications?
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <Alert className="bg-glass-bg/80 border-glass-border text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-glass-text">
                  The following questionnaire contains sensitive topics that may be triggering.
                  <Collapsible open={showLearnMore} onOpenChange={setShowLearnMore}>
                    <CollapsibleTrigger className="flex items-center gap-1 text-primary hover:underline mt-2">
                      Learn more
                      <ChevronDown className={`h-4 w-4 transition-transform ${showLearnMore ? "rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 text-sm text-muted-foreground">
                      We work to streamline data entry systems so that you only need to answer these questions once.
                      That being said, you're free to skip this questionnaire and come back to it later. There are still
                      resources available to you, without providing more information.
                    </CollapsibleContent>
                  </Collapsible>
                </AlertDescription>
              </Alert>
              <RadioGroup
                value={formData.housingApplicationOptIn}
                onValueChange={(value) => updateFormData("housingApplicationOptIn", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="yes-housing-app" />
                  <Label htmlFor="yes-housing-app" className="flex-1 cursor-pointer text-base">
                    Yes, I'd like to provide more details
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="no-housing-app" />
                  <Label htmlFor="no-housing-app" className="flex-1 cursor-pointer text-base">
                    No, skip for now
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Housing Application Questions - Only if opted in */}
        {/* Step 7: Sex Offender Registry */}
        {step === 7 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Are you or anyone in your household required to register on the sex offender registry?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.sexOffenderRegistry}
                onValueChange={(value) => updateFormData("sexOffenderRegistry", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="sex-offender-yes" />
                  <Label htmlFor="sex-offender-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="sex-offender-no" />
                  <Label htmlFor="sex-offender-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Where Sleep Frequently */}
        {step === 8 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Where do you and your family sleep most frequently?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <Textarea
                value={formData.whereSleepFrequently}
                onChange={(e) => updateFormData("whereSleepFrequently", e.target.value)}
                placeholder="Describe where you sleep..."
                className="min-h-[100px] text-base"
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Homeless Over Year */}
        {step === 9 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Have you been homeless for longer than a year?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.homelessOverYear}
                onValueChange={(value) => updateFormData("homelessOverYear", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="homeless-year-yes" />
                  <Label htmlFor="homeless-year-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="homeless-year-no" />
                  <Label htmlFor="homeless-year-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 10: Household Pregnant */}
        {step === 10 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Is anyone in your household pregnant?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.householdPregnant}
                onValueChange={(value) => updateFormData("householdPregnant", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="pregnant-yes" />
                  <Label htmlFor="pregnant-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="pregnant-no" />
                  <Label htmlFor="pregnant-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 11: Has Children */}
        {step === 11 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">Do you have any children?</h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.hasChildren}
                onValueChange={(value) => updateFormData("hasChildren", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="children-yes" />
                  <Label htmlFor="children-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="children-no" />
                  <Label htmlFor="children-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 12: Children Under Five */}
        {step === 12 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Are there children in your household under five years old?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.childrenUnderFive}
                onValueChange={(value) => updateFormData("childrenUnderFive", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="under-five-yes" />
                  <Label htmlFor="under-five-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="under-five-no" />
                  <Label htmlFor="under-five-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 13: Has Custody */}
        {step === 13 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Do you have custody of your children?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.hasCustody}
                onValueChange={(value) => updateFormData("hasCustody", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="custody-yes" />
                  <Label htmlFor="custody-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="custody-no" />
                  <Label htmlFor="custody-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>

              {formData.hasCustody === "no" && (
                <div className="animate-in fade-in duration-300 pt-2">
                  <p className="text-white/90 text-base mb-3">
                    Is the court requiring you to obtain housing before custody can be restored?
                  </p>
                  <RadioGroup
                    value={formData.custodyRequiresHousing}
                    onValueChange={(value) => updateFormData("custodyRequiresHousing", value)}
                    className="space-y-3 text-left"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="yes" id="custody-housing-yes" />
                      <Label htmlFor="custody-housing-yes" className="flex-1 cursor-pointer text-base">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="no" id="custody-housing-no" />
                      <Label htmlFor="custody-housing-no" className="flex-1 cursor-pointer text-base">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 14: Single Parent Household */}
        {step === 14 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Is your household a single-parent household?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.singleParentHousehold}
                onValueChange={(value) => updateFormData("singleParentHousehold", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="single-parent-yes" />
                  <Label htmlFor="single-parent-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="single-parent-no" />
                  <Label htmlFor="single-parent-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 15: Foster Care After 16 */}
        {step === 15 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Were you enrolled in foster care after the age of 16?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.fosterCareAfter16}
                onValueChange={(value) => updateFormData("fosterCareAfter16", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="foster-yes" />
                  <Label htmlFor="foster-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="foster-no" />
                  <Label htmlFor="foster-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 16: Household Disability */}
        {step === 16 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Do you or anyone in your household have any long-term disability or ongoing health disability?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.householdDisability}
                onValueChange={(value) => updateFormData("householdDisability", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="household-disability-yes" />
                  <Label htmlFor="household-disability-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="household-disability-no" />
                  <Label htmlFor="household-disability-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 17: Housing Accommodations */}
        {step === 17 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Do you or anyone in your household require housing-related accommodations?
              </h2>
              <p className="text-white/90 text-base drop-shadow">Select all that apply</p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-3 text-left">
                {[
                  "First floor or one story",
                  "No stairs",
                  "Wide door frames",
                  "Support bars in bathroom and shower",
                  "Roll-in shower",
                  "Low sinks",
                ].map((accommodation) => (
                  <div
                    key={accommodation}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={accommodation}
                      checked={formData.housingAccommodations.includes(accommodation)}
                      onCheckedChange={() => toggleAccommodation(accommodation)}
                    />
                    <Label htmlFor={accommodation} className="flex-1 cursor-pointer text-base">
                      {accommodation}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 18: Adults Independent Care */}
        {step === 18 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Are all adults in your household able to independently care for themselves?
              </h2>
              <p className="text-white/90 text-base drop-shadow">
                (such as getting dressed, bathing, grooming, administering medication, eating, etc.)
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.adultsIndependentCare}
                onValueChange={(value) => updateFormData("adultsIndependentCare", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="independent-yes" />
                  <Label htmlFor="independent-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="independent-no" />
                  <Label htmlFor="independent-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 19: Monthly Income */}
        {step === 19 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                What is your combined (household) monthly income before taxes?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <Input
                value={formData.monthlyIncome}
                onChange={(e) => updateFormData("monthlyIncome", e.target.value)}
                placeholder="Monthly income"
                className="text-lg h-12"
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 20: Housing Voucher */}
        {step === 20 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Do you have a housing voucher or dedicated rental subsidy that will last for at least one year?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.hasHousingVoucher}
                onValueChange={(value) => updateFormData("hasHousingVoucher", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="voucher-yes" />
                  <Label htmlFor="voucher-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="voucher-no" />
                  <Label htmlFor="voucher-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 21: Poor Credit */}
        {step === 21 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">Barriers to housing</h2>
              <p className="text-white/90 text-lg drop-shadow">
                Has having poor credit or no credit/rental history prevented you from obtaining permanent housing?
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.poorCreditPreventedHousing}
                onValueChange={(value) => updateFormData("poorCreditPreventedHousing", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="poor-credit-yes" />
                  <Label htmlFor="poor-credit-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="poor-credit-no" />
                  <Label htmlFor="poor-credit-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 22: Eviction History */}
        {step === 22 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Have you or anyone in your household had an eviction in the past seven years?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.evictionPastSevenYears}
                onValueChange={(value) => updateFormData("evictionPastSevenYears", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="eviction-yes" />
                  <Label htmlFor="eviction-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="eviction-no" />
                  <Label htmlFor="eviction-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 23: Justice System */}
        {step === 23 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Have you or anyone in your household been affected by the justice or criminal system that prevented you
                from being housed?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.justiceSystemPreventedHousing}
                onValueChange={(value) => updateFormData("justiceSystemPreventedHousing", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="justice-yes" />
                  <Label htmlFor="justice-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="justice-no" />
                  <Label htmlFor="justice-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 24: Immigration Status */}
        {step === 24 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Have you or anyone in your household struggled to obtain permanent housing due to immigration status?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.immigrationStatusPreventedHousing}
                onValueChange={(value) => updateFormData("immigrationStatusPreventedHousing", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="immigration-yes" />
                  <Label htmlFor="immigration-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="immigration-no" />
                  <Label htmlFor="immigration-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 25: Trusted Contacts */}
        {step === 25 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Do you have 2–3 trusted contacts you can list on a housing application?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.hasTrustedContacts}
                onValueChange={(value) => updateFormData("hasTrustedContacts", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="contacts-yes" />
                  <Label htmlFor="contacts-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="contacts-no" />
                  <Label htmlFor="contacts-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 26: Physical Health Crisis */}
        {step === 26 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">Health crises</h2>
              <p className="text-white/90 text-lg drop-shadow">
                Have you or any household member experienced a physical health crisis within the last 3 months?
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.physicalHealthCrisis}
                onValueChange={(value) => updateFormData("physicalHealthCrisis", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="physical-crisis-yes" />
                  <Label htmlFor="physical-crisis-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="physical-crisis-no" />
                  <Label htmlFor="physical-crisis-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 27: Mental Health Crisis */}
        {step === 27 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Have you or any household member experienced a mental health crisis within the last 3 months?
              </h2>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.mentalHealthCrisis}
                onValueChange={(value) => updateFormData("mentalHealthCrisis", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="mental-crisis-yes" />
                  <Label htmlFor="mental-crisis-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="mental-crisis-no" />
                  <Label htmlFor="mental-crisis-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 28: Violence/Trauma */}
        {step === 28 && formData.housingApplicationOptIn === "yes" && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">Trauma and safety</h2>
              <p className="text-white/90 text-lg drop-shadow">
                In the past 3 months, have you or anyone in your household experienced any of the following: domestic
                violence, dating violence, stalking, sexual assault, or human trafficking?
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.violenceTrauma}
                onValueChange={(value) => updateFormData("violenceTrauma", value)}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="violence-yes" />
                  <Label htmlFor="violence-yes" className="flex-1 cursor-pointer text-base">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="violence-no" />
                  <Label htmlFor="violence-no" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 29: Health Concerns */}
        {step === 29 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">Health and wellness</h2>
              <p className="text-white/90 text-lg drop-shadow">
                Are there any health concerns we should know about to help you better?
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.healthConcerns}
                onValueChange={(value) => {
                  updateFormData("healthConcerns", value);
                  if (value === "no") {
                    updateFormData("healthDetails", "");
                  }
                }}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="yes-health" />
                  <Label htmlFor="yes-health" className="flex-1 cursor-pointer text-base">
                    Yes, I'd like to share more
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="no-health" />
                  <Label htmlFor="no-health" className="flex-1 cursor-pointer text-base">
                    No, not right now
                  </Label>
                </div>
              </RadioGroup>

              {formData.healthConcerns === "yes" && (
                <div className="animate-in fade-in duration-300 pt-2">
                  <Textarea
                    value={formData.healthDetails}
                    onChange={(e) => updateFormData("healthDetails", e.target.value)}
                    placeholder="Share what you're comfortable with..."
                    className="min-h-[120px] text-base"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 30: Education */}
        {step === 30 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">Education and goals</h2>
              <p className="text-white/90 text-lg drop-shadow">Where are you at with school?</p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.education}
                onValueChange={(value) => updateFormData("education", value)}
                className="space-y-3 text-left"
              >
                {[
                  { value: "currently-in-school", label: "Currently in school" },
                  { value: "left-want-back", label: "Left school but want to go back" },
                  { value: "graduated", label: "Graduated high school" },
                  { value: "working-ged", label: "Working on GED" },
                  { value: "not-interested", label: "Not interested right now" },
                  { value: "prefer-not-say", label: "Prefer not to say" },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 31: Voluntary Identification */}
        {step === 31 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">Voluntary Identification</h2>
              <p className="text-white/90 text-lg drop-shadow">
                Do you have any disabilities? This helps us search for specific resources.
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <RadioGroup
                value={formData.disabilities}
                onValueChange={(value) => {
                  updateFormData("disabilities", value);
                  if (value === "no") {
                    updateFormData("disabilityDetails", "");
                  }
                }}
                className="space-y-3 text-left"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="yes" id="yes-disability" />
                  <Label htmlFor="yes-disability" className="flex-1 cursor-pointer text-base">
                    Yes, I'd like to share more
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="no" id="no-disability" />
                  <Label htmlFor="no-disability" className="flex-1 cursor-pointer text-base">
                    No
                  </Label>
                </div>
              </RadioGroup>

              {formData.disabilities === "yes" && (
                <div className="animate-in fade-in duration-300 pt-2">
                  <Textarea
                    value={formData.disabilityDetails}
                    onChange={(e) => updateFormData("disabilityDetails", e.target.value)}
                    placeholder="Share what you're comfortable with..."
                    className="min-h-[120px] text-base"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleContinue} className="flex-1 h-12 text-lg">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 32: Additional Information */}
        {step === 32 && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-light text-white drop-shadow-lg">
                Anything else you'd like to share?
              </h2>
              <p className="text-white/90 text-lg drop-shadow">
                We appreciate so much all the time you've taken to share your story. We see you and we are more than
                happy to be able to help.
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <Textarea
                value={formData.additionalInfo}
                onChange={(e) => updateFormData("additionalInfo", e.target.value)}
                placeholder="Share anything else you'd like us to know..."
                className="min-h-[150px] text-base"
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="h-12 text-lg px-6">
                  Back
                </Button>
                <div className="flex-1 flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1 h-12 text-lg">
                    Skip for now
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1 h-12 text-lg">
                    See My Resources
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
