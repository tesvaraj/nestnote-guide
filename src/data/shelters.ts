// Sample shelter data with real coordinates
// These are example shelters - replace with actual data as needed

export interface Shelter {
  id: string;
  name: string;
  type: "emergency" | "youth" | "family";
  availableBeds: number;
  lat: number;
  lng: number;
  address: string;
}

// Default shelters in San Francisco area (can be updated based on actual location)
export const sampleShelters: Shelter[] = [
  {
    id: "1",
    name: "Emergency Shelter",
    type: "emergency",
    availableBeds: 12,
    lat: 37.7749,
    lng: -122.4194,
    address: "Downtown San Francisco"
  },
  {
    id: "2",
    name: "Youth Shelter",
    type: "youth",
    availableBeds: 5,
    lat: 37.7849,
    lng: -122.4094,
    address: "North Beach, San Francisco"
  },
  {
    id: "3",
    name: "Family Shelter",
    type: "family",
    availableBeds: 3,
    lat: 37.7649,
    lng: -122.4294,
    address: "Mission District, San Francisco"
  }
];
