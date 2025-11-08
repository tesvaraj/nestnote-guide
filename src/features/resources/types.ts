// 📋 FRONTEND: Resource type definitions
// This file defines the data structures for resources (shelters, services, etc.)

export interface SavedResource {
  id: string;
  name: string;
  type: string;
  address: string;
  phone?: string;
  hours?: string;
}
