export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  age: number;
  country: string;
  city: string;
  heightCm: number;
  email: string;
  phone: string;
  college: string;
  degree: string;
  incomeLPA: number;
  company: string;
  designation: string;
  maritalStatus:
    | "Single"
    | "Married"
    | "Divorced"
    | "Widowed"
    | "Never Married";
  languages: string[];
  siblings: number;
  caste: string;
  religion: string;
  wantKids: "Yes" | "No" | "Maybe";
  openToRelocate: "Yes" | "No" | "Maybe";
  openToPets: "Yes" | "No" | "Maybe";
  status: "Active" | "Paused" | "Inactive" | "Searching";
  hobbies: string;
  manglik: "Yes" | "No" | "Doesn't Matter";
  motherTongue: string;
  familyType: "Nuclear" | "Joint" | "Extended";
  familyValues: "Traditional" | "Moderate" | "Liberal";
  drinkingHabits: "Never" | "Occasionally" | "Socially" | "Regularly";
  smokingHabits: "Never" | "Occasionally" | "Socially" | "Regularly";
  dietPreference:
    | "Vegetarian"
    | "Non-Vegetarian"
    | "Vegan"
    | "Eggetarian"
    | "Jain Vegetarian";
  notes: string;
  photoColor: string;
  type: "pool" | "matched";
}
