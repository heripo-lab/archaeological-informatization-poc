import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Artifact, ExcavatedSite, Feature, Trench } from '@/models/db.model';
import { v4 as uuidv4 } from 'uuid';

type MadeData = {
  excavatedSite: ExcavatedSite;
  trenches: Trench[];
  features: Feature[];
  artifacts: Artifact[];
};

// ID 매핑 테이블: 기존 ID -> 새로운 ID
type IdMapping = {
  trenches: Map<string, string>;
  features: Map<string, string>;
};

const getDbPath = () => {
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'excavation.db');
};

const getDatabase = () => {
  return new Database(getDbPath());
};

// 기존 데이터베이스에서 ID 목록을 가져오는 함수
const getExistingIds = () => {
  const db = getDatabase();

  const existingIds = {
    trenches: new Set<string>(),
    features: new Set<string>(),
    artifacts: new Set<string>(),
  };

  try {
    // 기존 테이블에서 ID 가져오기
    const existingTrenchIds = db.prepare('SELECT id FROM trenches').all() as { id: string }[];
    const existingFeatureIds = db.prepare('SELECT id FROM features').all() as { id: string }[];
    const existingArtifactIds = db.prepare('SELECT id FROM artifacts').all() as { id: string }[];

    existingTrenchIds.forEach(row => existingIds.trenches.add(row.id));
    existingFeatureIds.forEach(row => existingIds.features.add(row.id));
    existingArtifactIds.forEach(row => existingIds.artifacts.add(row.id));

    return existingIds;
  } catch (error) {
    console.error('기존 ID 목록 조회 중 오류:', error);
    return existingIds; // 오류 시 빈 세트 반환
  }
};

const sanitizeData = (data: MadeData): { sanitizedData: MadeData; idMapping: IdMapping } => {
  console.log('데이터 정제 시작...');

  const db = getDatabase();
  const existingIds = getExistingIds();
  db.close();

  // ID 매핑 테이블 초기화
  const idMapping: IdMapping = {
    trenches: new Map<string, string>(),
    features: new Map<string, string>(),
  };

  // 1. 트렌치 ID 중복 검사 및 처리
  const trenchIdSet = new Set<string>([...existingIds.trenches]);
  const sanitizedTrenches = data.trenches.map(trench => {
    if (!trench.id || trenchIdSet.has(trench.id)) {
      const oldId = trench.id;
      const newId = uuidv4();
      console.log(`트렌치 ID 중복 또는 누락 (${oldId || 'undefined'}): 새 ID ${newId} 할당`);
      // ID 매핑 테이블에 기록
      idMapping.trenches.set(oldId, newId);
      return { ...trench, id: newId };
    }
    // 중복이 아닌 ID는 세트에 추가
    trenchIdSet.add(trench.id);
    return trench;
  });

  // 2. 유구 ID 중복 검사 및 처리
  const featureIdSet = new Set<string>([...existingIds.features]);
  const sanitizedFeatures = data.features.map(feature => {
    if (!feature.id || featureIdSet.has(feature.id)) {
      const oldId = feature.id;
      const newId = uuidv4();
      console.log(`유구 ID 중복 또는 누락 (${oldId || 'undefined'}): 새 ID ${newId} 할당`);
      // ID 매핑 테이블에 기록
      idMapping.features.set(oldId, newId);
      return { ...feature, id: newId };
    }
    // 중복이 아닌 ID는 세트에 추가
    featureIdSet.add(feature.id);
    return feature;
  });

  // 3. 유물 ID 중복 검사 및 처리
  const artifactIdSet = new Set<string>([...existingIds.artifacts]);
  const sanitizedArtifacts = data.artifacts.map(artifact => {
    // ID 처리
    const newArtifact = { ...artifact };

    if (!artifact.id || artifactIdSet.has(artifact.id)) {
      const newId = uuidv4();
      console.log(`유물 ID 중복 또는 누락 (${artifact.id || 'undefined'}): 새 ID ${newId} 할당`);
      newArtifact.id = newId;
    }
    artifactIdSet.add(newArtifact.id);

    // 관련 참조 ID 업데이트
    if (artifact.feature_id && idMapping.features.has(artifact.feature_id)) {
      const newFeatureId = idMapping.features.get(artifact.feature_id);
      console.log(`유물(${newArtifact.id})의 유구 참조 업데이트: ${artifact.feature_id} → ${newFeatureId}`);
      newArtifact.feature_id = newFeatureId ?? null;
    }

    if (artifact.trench_id && idMapping.trenches.has(artifact.trench_id)) {
      const newTrenchId = idMapping.trenches.get(artifact.trench_id);
      console.log(`유물(${newArtifact.id})의 트렌치 참조 업데이트: ${artifact.trench_id} → ${newTrenchId}`);
      newArtifact.trench_id = newTrenchId ?? null;
    }

    return newArtifact;
  });

  console.log('데이터 정제 완료');

  return {
    sanitizedData: {
      excavatedSite: data.excavatedSite,
      trenches: sanitizedTrenches,
      features: sanitizedFeatures,
      artifacts: sanitizedArtifacts,
    },
    idMapping,
  };
};

// 데이터 삽입 함수
const insertDatabase = (data: MadeData) => {
  // 데이터 정제 수행 및 ID 매핑 정보 획득
  const { sanitizedData } = sanitizeData(data);

  const db = getDatabase();

  try {
    // 트랜잭션 시작
    db.exec('BEGIN TRANSACTION');

    // 발굴 현장 삽입
    const insertExcavatedSite = db.prepare(`
      INSERT INTO excavated_sites VALUES (
        @id, @report_id, @site_name, @location_admin, @start_date, @end_date,
        @investigator_organization, @coordinate_lat, @coordinate_lng, @area_m2,
        @terrain_description, @grid_system_desc, @excavation_depth_max, @remarks, @images
      )
    `);

    insertExcavatedSite.run({
      ...sanitizedData.excavatedSite,
      report_id: sanitizedData.excavatedSite.report_id || '',
      site_name: sanitizedData.excavatedSite.site_name || '미상',
      location_admin: sanitizedData.excavatedSite.location_admin || '',
      start_date: sanitizedData.excavatedSite.start_date || null,
      end_date: sanitizedData.excavatedSite.end_date || null,
      investigator_organization: sanitizedData.excavatedSite.investigator_organization || '',
      coordinate_lat: sanitizedData.excavatedSite.coordinate_lat || null,
      coordinate_lng: sanitizedData.excavatedSite.coordinate_lng || null,
      area_m2: sanitizedData.excavatedSite.area_m2 || null,
      terrain_description: sanitizedData.excavatedSite.terrain_description || '',
      grid_system_desc: sanitizedData.excavatedSite.grid_system_desc || '',
      excavation_depth_max: sanitizedData.excavatedSite.excavation_depth_max || null,
      remarks: sanitizedData.excavatedSite.remarks || '',
      images: JSON.stringify(sanitizedData.excavatedSite.images || []),
    });

    // 트렌치 삽입
    const insertTrench = db.prepare(`
      INSERT INTO trenches VALUES (
        @id, @excavated_site_id, @trench_number, @trench_name, @description,
        @position_description, @orientation, @length_m, @width_m, @depth_max_m,
        @slope_description, @stratigraphy_count, @key_findings, @disturbance_or_condition,
        @remarks, @coordinate_lat, @coordinate_lng, @images, @page_references
      )
    `);

    for (const trench of sanitizedData.trenches) {
      insertTrench.run({
        ...trench,
        trench_number: trench.trench_number || '',
        trench_name: trench.trench_name || trench.trench_number || '미상',
        description: trench.description || '',
        position_description: trench.position_description || '',
        orientation: trench.orientation || '',
        length_m: trench.length_m || null,
        width_m: trench.width_m || null,
        depth_max_m: trench.depth_max_m || null,
        slope_description: trench.slope_description || '',
        stratigraphy_count: trench.stratigraphy_count || 0,
        key_findings: trench.key_findings || '',
        disturbance_or_condition: trench.disturbance_or_condition || '',
        remarks: trench.remarks || '',
        coordinate_lat: trench.coordinate_lat || null,
        coordinate_lng: trench.coordinate_lng || null,
        images: JSON.stringify(trench.images || []),
        page_references: JSON.stringify(trench.page_references || []),
      });
    }

    // 유구 삽입
    const insertFeature = db.prepare(`
      INSERT INTO features VALUES (
        @id, @excavated_site_id, @feature_number, @feature_name, @description,
        @feature_type, @subtype_or_form, @associated_period, @construction_method,
        @material, @dimension_description, @shape_plan, @shape_section, @plan_summary,
        @posthole_count, @posthole_detail, @structure_description, @location_context,
        @stratigraphy_relation, @interpretation, @artifact_presence, @disturbance_or_condition,
        @coordinate_lat, @coordinate_lng, @images, @remarks, @page_references
      )
    `);

    for (const feature of sanitizedData.features) {
      insertFeature.run({
        ...feature,
        feature_number: feature.feature_number || '',
        feature_name: feature.feature_name || '미상',
        description: feature.description || '',
        feature_type: feature.feature_type || '',
        subtype_or_form: feature.subtype_or_form || '',
        associated_period: feature.associated_period || '',
        construction_method: feature.construction_method || '',
        material: feature.material || '',
        dimension_description: feature.dimension_description || '',
        shape_plan: feature.shape_plan || '',
        shape_section: feature.shape_section || '',
        plan_summary: feature.plan_summary || '',
        posthole_count: feature.posthole_count || 0,
        posthole_detail: feature.posthole_detail || '',
        structure_description: feature.structure_description || '',
        location_context: feature.location_context || '',
        stratigraphy_relation: feature.stratigraphy_relation || '',
        interpretation: feature.interpretation || '',
        artifact_presence: feature.artifact_presence || '',
        disturbance_or_condition: feature.disturbance_or_condition || '',
        coordinate_lat: feature.coordinate_lat || null,
        coordinate_lng: feature.coordinate_lng || null,
        images: JSON.stringify(feature.images || []),
        remarks: feature.remarks || '',
        page_references: JSON.stringify(feature.page_references || []),
      });
    }

    // 유물 삽입
    const insertArtifact = db.prepare(`
      INSERT INTO artifacts VALUES (
        @id, @excavated_site_id, @feature_id, @trench_id, @artifact_number, @artifact_name,
        @description, @artifact_type, @subtype_or_name, @material, @shape_or_morphology,
        @dimension_description, @weight_g, @decoration_or_pattern, @manufacture_technique,
        @damage_or_condition, @associated_period, @coordinate_lat, @coordinate_lng,
        @images, @remarks, @page_references
      )
    `);

    for (const artifact of sanitizedData.artifacts) {
      insertArtifact.run({
        ...artifact,
        feature_id: artifact.feature_id || null,
        trench_id: artifact.trench_id || null,
        artifact_number: artifact.artifact_number || '',
        artifact_name: artifact.artifact_name || '미상',
        description: artifact.description || '',
        artifact_type: artifact.artifact_type || '',
        subtype_or_name: artifact.subtype_or_name || '',
        material: artifact.material || '',
        shape_or_morphology: artifact.shape_or_morphology || '',
        dimension_description: artifact.dimension_description || '',
        weight_g: artifact.weight_g || null,
        decoration_or_pattern: artifact.decoration_or_pattern || '',
        manufacture_technique: artifact.manufacture_technique || '',
        damage_or_condition: artifact.damage_or_condition || '',
        associated_period: artifact.associated_period || '',
        coordinate_lat: artifact.coordinate_lat || null,
        coordinate_lng: artifact.coordinate_lng || null,
        images: JSON.stringify(artifact.images || []),
        remarks: artifact.remarks || '',
        page_references: JSON.stringify(artifact.page_references || []),
      });
    }

    // 트랜잭션 종료
    db.exec('COMMIT');

    console.log('데이터베이스에 데이터 삽입 완료');
    return { success: true };
  } catch (error) {
    // 에러 발생 시 롤백
    db.exec('ROLLBACK');
    console.error('데이터베이스 삽입 오류:', error);
    return { success: false, error };
  } finally {
    // 데이터베이스 연결 종료
    db.close();
  }
};

export default insertDatabase;
