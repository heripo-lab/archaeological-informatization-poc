export interface ExcavatedSite {
  id: string;
  report_id: string;
  site_name: string;
  location_admin: string | null;
  start_date: string | null;
  end_date: string | null;
  investigator_organization: string | null;
  coordinate_lat: number | null;
  coordinate_lng: number | null;
  area_m2: number | null;
  terrain_description: string;
  grid_system_desc: string | null;
  excavation_depth_max: number | null;
  remarks: string | null;
  images: string[]; // JSON 문자열 배열
}

export interface Trench {
  id: string;
  excavated_site_id: string;
  trench_number: string;
  trench_name: string;
  description: string;
  position_description: string | null;
  orientation: string | null;
  length_m: number | null;
  width_m: number | null;
  depth_max_m: number | null;
  slope_description: string | null;
  stratigraphy_count: number | null;
  key_findings: string | null;
  disturbance_or_condition: string | null;
  remarks: string | null;
  coordinate_lat: number | null;
  coordinate_lng: number | null;
  images: string[]; // JSON 문자열 배열
  page_references: number[];
}

export interface Feature {
  id: string;
  excavated_site_id: string;
  feature_number: string;
  feature_name: string;
  description: string | null;
  feature_type: string | null;
  subtype_or_form: string | null;
  associated_period: string | null;
  construction_method: string | null;
  material: string | null;
  dimension_description: string | null;
  shape_plan: string | null;
  shape_section: string | null;
  plan_summary: string | null;
  posthole_count: number | null;
  posthole_detail: string | null;
  structure_description: string | null;
  location_context: string | null;
  stratigraphy_relation: string | null;
  interpretation: string | null;
  artifact_presence: string | null;
  disturbance_or_condition: string | null;
  coordinate_lat: number | null;
  coordinate_lng: number | null;
  images: string[]; // JSON 문자열 배열
  remarks: string;
  page_references: number[];
}

export interface Artifact {
  id: string;
  excavated_site_id: string;
  feature_id: string | null;
  trench_id: string | null;
  artifact_number: string;
  artifact_name: string;
  description: string;
  artifact_type: string | null;
  subtype_or_name: string | null;
  material: string | null;
  shape_or_morphology: string | null;
  dimension_description: string | null;
  weight_g: number | null;
  decoration_or_pattern: string | null;
  manufacture_technique: string | null;
  damage_or_condition: string | null;
  associated_period: string | null;
  coordinate_lat: number | null;
  coordinate_lng: number | null;
  images: string[]; // JSON 문자열 배열
  remarks: string | null;
  page_references: number[];
}
