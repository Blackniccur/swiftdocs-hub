import { Car, Briefcase, Bot, BookOpen, type LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Car,
  Briefcase,
  Bot,
  BookOpen,
};

export const serviceLabels: Record<string, string> = {
  driving_license: "Driving License",
  outlier_account: "Outlier USA Profile",
  handshake_ai: "Handshake Project Helix",
  mercor_ai: "Mercor AI",
  full_course: "Freelancing AI Course",
  mindtrift: "Mindtrift Account",
  lilt_ai: "Lilt AI Account",
  handshake_oscar: "Handshake Project Oscar",
  project_hedgehog: "Project Hedgehog",
  outlier_philippines: "Outlier Philippines Profile",
  outlier_uk: "Outlier UK Profile",
  
};

export const serviceCategories: Record<string, string> = {
  driving_license: "Documents",
  outlier_account: "AI Platforms",
  outlier_philippines: "AI Platforms",
  outlier_uk: "AI Platforms",
  handshake_ai: "AI Platforms",
  handshake_oscar: "AI Platforms",
  project_hedgehog: "AI Platforms",
  mercor_ai: "AI Platforms",
  mindtrift: "AI Platforms",
  lilt_ai: "AI Platforms",
  full_course: "Courses",
};

export const categoryList = ["All", "Documents", "AI Platforms", "Courses"];

export const statusLabels: Record<string, string> = {

  submitted: "Order Placed",
  documents_review: "Under Review",
  processing: "Processing",
  ready: "Ready",
  rejected: "Rejected",
};

export const statusProgress: Record<string, number> = {
  submitted: 20,
  documents_review: 40,
  processing: 65,
  ready: 100,
  rejected: 0,
};

export type ServicePrice = {
  id: string;
  service_key: string;
  label: string;
  description: string;
  price: number;
  features: string[];
  icon_name: string;
  is_active: boolean;
  display_order: number;
};
