import { supabase } from "@/integrations/supabase/client";

export type ProfileData = {
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

export async function saveProfile(data: ProfileData) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // If no user, create an anonymous user
    const { data: { user: anonUser }, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    if (!anonUser) throw new Error("Failed to create anonymous user");
    
    return await insertProfile(anonUser.id, data);
  }

  return await insertProfile(user.id, data);
}

async function insertProfile(userId: string, data: ProfileData) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      name: data.name,
      age: data.age,
      housing_situation: data.housingSituation,
      housing_search_type: data.housingSearchType,
      immediate_needs: data.immediateNeeds,
      health_concerns: data.healthConcerns,
      health_details: data.healthDetails,
      education: data.education,
      disabilities: data.disabilities,
      disability_details: data.disabilityDetails,
      additional_info: data.additionalInfo,
      housing_application_opt_in: data.housingApplicationOptIn === "yes",
      sex_offender_registry: data.sexOffenderRegistry === "yes" ? true : data.sexOffenderRegistry === "no" ? false : null,
      where_sleep_frequently: data.whereSleepFrequently,
      homeless_over_year: data.homelessOverYear === "yes" ? true : data.homelessOverYear === "no" ? false : null,
      household_pregnant: data.householdPregnant === "yes" ? true : data.householdPregnant === "no" ? false : null,
      has_children: data.hasChildren === "yes" ? true : data.hasChildren === "no" ? false : null,
      children_under_five: data.childrenUnderFive === "yes" ? true : data.childrenUnderFive === "no" ? false : null,
      has_custody: data.hasCustody === "yes" ? true : data.hasCustody === "no" ? false : null,
      custody_requires_housing: data.custodyRequiresHousing === "yes" ? true : data.custodyRequiresHousing === "no" ? false : null,
      single_parent_household: data.singleParentHousehold === "yes" ? true : data.singleParentHousehold === "no" ? false : null,
      foster_care_after_16: data.fosterCareAfter16 === "yes" ? true : data.fosterCareAfter16 === "no" ? false : null,
      household_disability: data.householdDisability === "yes" ? true : data.householdDisability === "no" ? false : null,
      housing_accommodations: data.housingAccommodations,
      adults_independent_care: data.adultsIndependentCare === "yes" ? true : data.adultsIndependentCare === "no" ? false : null,
      monthly_income: data.monthlyIncome,
      has_housing_voucher: data.hasHousingVoucher === "yes" ? true : data.hasHousingVoucher === "no" ? false : null,
      poor_credit_prevented_housing: data.poorCreditPreventedHousing === "yes" ? true : data.poorCreditPreventedHousing === "no" ? false : null,
      eviction_past_seven_years: data.evictionPastSevenYears === "yes" ? true : data.evictionPastSevenYears === "no" ? false : null,
      justice_system_prevented_housing: data.justiceSystemPreventedHousing === "yes" ? true : data.justiceSystemPreventedHousing === "no" ? false : null,
      immigration_status_prevented_housing: data.immigrationStatusPreventedHousing === "yes" ? true : data.immigrationStatusPreventedHousing === "no" ? false : null,
      has_trusted_contacts: data.hasTrustedContacts === "yes" ? true : data.hasTrustedContacts === "no" ? false : null,
      physical_health_crisis: data.physicalHealthCrisis === "yes" ? true : data.physicalHealthCrisis === "no" ? false : null,
      mental_health_crisis: data.mentalHealthCrisis === "yes" ? true : data.mentalHealthCrisis === "no" ? false : null,
      violence_trauma: data.violenceTrauma === "yes" ? true : data.violenceTrauma === "no" ? false : null,
    })
    .select()
    .single();

  if (error) throw error;
  return profile;
}
