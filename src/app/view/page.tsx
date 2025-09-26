'use client';

import { Artifact, ExcavatedSite, Feature, Trench } from '@/models/db.model';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

/**
 * - GET /api/excavated-sites -> 유적 목록 전부 가져오기
 * - GET /api/excavated-sites/:excavatedSiteId/trenches -> 특정 유적의 트렌치 목록 전부 가져오기
 * - GET /api/excavated-sites/:excavatedSiteId/features -> 특정 유적의 유구 목록 전부 가져오기
 * - GET /api/excavated-sites/:excavatedSiteId/artifacts -> 특정 유적의 유물 목록 전부 가져오기
 * - GET /api/trenches/:trenchId/artifacts -> 특정 유구의 유물 목록 전부 가져오기
 * - GET /api/features/:featureId/artifacts -> 특정 유구의 유물 목록 전부 가져오기
 */

export default function Page() {
  const [sites, setSites] = useState<ExcavatedSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<ExcavatedSite | null>(null);

  const [trenches, setTrenches] = useState<Trench[]>([]); // 트렌치 목록
  const [selectedTrench, setSelectedTrench] = useState<Trench | null>(null); // 선택된 트렌치

  const [features, setFeatures] = useState<Feature[]>([]); // 유구 목록
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null); // 선택된 유구

  const [trenchArtifacts, setTrenchArtifacts] = useState<Artifact[]>([]); // 트렌치의 유물 목록
  const [featureArtifacts, setFeatureArtifacts] = useState<Artifact[]>([]); // 유구의 유물 목록

  const [activeTab, setActiveTab] = useState<'overview' | 'trenches' | 'features'>('overview');
  const [error, setError] = useState<string | null>(null);

  // 유적 목록 가져오기
  const fetchSites = async () => {
    try {
      const response = await fetch('/api/excavated-sites');
      if (!response.ok) {
        throw new Error('유적 데이터를 가져오는 중 오류가 발생했습니다');
      }
      const data = await response.json();
      setSites(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sites:', err);
    }
  };

  // 트렌치 목록 가져오기
  const fetchTrenches = async (siteId: string) => {
    try {
      const response = await fetch(`/api/excavated-sites/${siteId}/trenches`);
      if (!response.ok) {
        throw new Error('트렌치 데이터를 가져오는 중 오류가 발생했습니다');
      }
      const data = await response.json();
      setTrenches(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching trenches:', err);
    }
  };

  // 유구 목록 가져오기
  const fetchFeatures = async (siteId: string) => {
    try {
      const response = await fetch(`/api/excavated-sites/${siteId}/features`);
      if (!response.ok) {
        throw new Error('유구 데이터를 가져오는 중 오류가 발생했습니다');
      }
      const data = await response.json();
      setFeatures(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching features:', err);
    }
  };

  // 트렌치 유물 목록 가져오기
  const fetchTrenchArtifacts = async (trenchId: string) => {
    try {
      const response = await fetch(`/api/trenches/${trenchId}/artifacts`);
      if (!response.ok) {
        throw new Error('트렌치 유물 데이터를 가져오는 중 오류가 발생했습니다');
      }
      const data = await response.json();
      setTrenchArtifacts(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching trench artifacts:', err);
    }
  };

  // 유구 유물 목록 가져오기
  const fetchFeatureArtifacts = async (featureId: string) => {
    try {
      const response = await fetch(`/api/features/${featureId}/artifacts`);
      if (!response.ok) {
        throw new Error('유구 유물 데이터를 가져오는 중 오류가 발생했습니다');
      }
      const data = await response.json();
      setFeatureArtifacts(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching feature artifacts:', err);
    }
  };

  // 첫 렌더시 유적 목록 가져오기
  useEffect(() => {
    fetchSites();
  }, []);

  // 유적 선택 핸들러
  const handleSelectSite = (site: ExcavatedSite) => {
    setSelectedSite(site);
    setActiveTab('overview');

    // 유적이 선택되면 해당 유적의 트렌치와 유구 데이터 미리 로드
    fetchTrenches(site.id);
    fetchFeatures(site.id);

    // 이전 선택 초기화
    setSelectedTrench(null);
    setSelectedFeature(null);
    setTrenchArtifacts([]);
    setFeatureArtifacts([]);
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: 'overview' | 'trenches' | 'features') => {
    setActiveTab(tab);

    // 트렌치 탭으로 변경될 때 데이터가 없으면 로드
    if (tab === 'trenches' && selectedSite && trenches.length === 0) {
      fetchTrenches(selectedSite.id);
    }

    // 유구 탭으로 변경될 때 데이터가 없으면 로드
    if (tab === 'features' && selectedSite && features.length === 0) {
      fetchFeatures(selectedSite.id);
    }
  };

  // 트렌치 선택 핸들러
  const handleSelectTrench = (trench: Trench) => {
    setSelectedTrench(trench);
    fetchTrenchArtifacts(trench.id);
  };

  // 유구 선택 핸들러 추가
  const handleSelectFeature = (feature: Feature) => {
    setSelectedFeature(feature);
    fetchFeatureArtifacts(feature.id);
  };

  return (
    <div className={styles.container}>
      {/* 사이드바 - 유적 목록 */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>유적 목록</h2>
        </div>

        <div className={styles.siteList}>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : sites.length === 0 ? (
            <p className={styles.empty}>등록된 유적이 없습니다</p>
          ) : (
            sites.map(site => (
              <div
                key={site.id}
                className={`${styles.siteItem} ${selectedSite?.id === site.id ? styles.activeSite : ''}`}
                onClick={() => handleSelectSite(site)}
              >
                <h3>{site.site_name}</h3>
                {site.location_admin && <p className={styles.siteLocation}>{site.location_admin}</p>}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* 메인 영역 */}
      <main className={styles.mainContent}>
        {selectedSite ? (
          <div className={styles.siteDetail}>
            <h1 className={styles.siteTitle}>{selectedSite.site_name}</h1>

            {/* 탭 네비게이션 */}
            <div className={styles.tabNavigation}>
              <button
                className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                개요
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'trenches' ? styles.activeTab : ''}`}
                onClick={() => handleTabChange('trenches')}
              >
                트렌치
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'features' ? styles.activeTab : ''}`}
                onClick={() => handleTabChange('features')}
              >
                유구
              </button>
            </div>

            {/* 탭 내용 */}
            <div className={styles.tabContent}>
              {activeTab === 'overview' && (
                <div className={styles.overviewTab}>
                  <h2>유적 개요</h2>
                  {selectedSite.terrain_description ? (
                    <div className={styles.descriptionBox}>
                      <h3>지형 설명</h3>
                      <p>{selectedSite.terrain_description}</p>
                    </div>
                  ) : (
                    <p>등록된 개요 정보가 없습니다.</p>
                  )}

                  {selectedSite.grid_system_desc && (
                    <div className={styles.descriptionBox}>
                      <h3>격자 또는 트렌치를 설정한 방식</h3>
                      <p>{selectedSite.grid_system_desc}</p>
                    </div>
                  )}

                  <div className={styles.infoGrid}>
                    {selectedSite.location_admin && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>위치:</span>
                        <span className={styles.infoValue}>{selectedSite.location_admin}</span>
                      </div>
                    )}

                    {selectedSite.location_admin && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>위도:</span>
                        <span className={styles.infoValue}>{selectedSite.coordinate_lat}</span>
                      </div>
                    )}

                    {selectedSite.coordinate_lng && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>경도:</span>
                        <span className={styles.infoValue}>{selectedSite.coordinate_lng}</span>
                      </div>
                    )}

                    {selectedSite.area_m2 && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>면적:</span>
                        <span className={styles.infoValue}>{selectedSite.area_m2}㎡</span>
                      </div>
                    )}

                    {selectedSite.start_date && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>조사 시작일:</span>
                        <span className={styles.infoValue}>{selectedSite.start_date}</span>
                      </div>
                    )}

                    {selectedSite.end_date && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>조사 종료일:</span>
                        <span className={styles.infoValue}>{selectedSite.end_date}</span>
                      </div>
                    )}

                    {selectedSite.investigator_organization && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>조사 기관:</span>
                        <span className={styles.infoValue}>{selectedSite.investigator_organization}</span>
                      </div>
                    )}
                  </div>

                  {selectedSite.remarks && (
                    <div className={styles.remarksSection}>
                      <h3>비고</h3>
                      <p>{selectedSite.remarks}</p>
                    </div>
                  )}

                  {selectedSite.images && selectedSite.images.length > 0 && (
                    <div className={styles.imagesSection}>
                      <h3>이미지</h3>
                      <div className={styles.imageGrid}>
                        {selectedSite.images.map((img, index) => (
                          <div key={index} className={styles.imageItem}>
                            <img src={img} alt={`${selectedSite.site_name} 이미지 ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'trenches' && (
                <div className={styles.trenchesTab}>
                  <h2>트렌치 목록</h2>
                  <div className={styles.splitLayout}>
                    <div className={styles.splitLeft}>
                      {trenches.length === 0 ? (
                        <p className={styles.empty}>등록된 트렌치가 없습니다.</p>
                      ) : (
                        <div className={styles.tableContainer}>
                          <table className={styles.dataTable}>
                            <thead>
                              <tr>
                                <th>번호</th>
                                <th>트렌치명</th>
                                <th>위치</th>
                                <th>크기</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trenches.map(trench => (
                                <tr
                                  key={trench.id}
                                  className={selectedTrench?.id === trench.id ? styles.activeRow : ''}
                                  onClick={() => handleSelectTrench(trench)}
                                >
                                  <td>{trench.trench_number}</td>
                                  <td>{trench.trench_name || `트렌치 ${trench.trench_number}`}</td>
                                  <td>{trench.position_description || '-'}</td>
                                  <td>
                                    {trench.length_m && trench.width_m
                                      ? `${trench.length_m}m × ${trench.width_m}m`
                                      : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className={styles.splitRight}>
                      {selectedTrench ? (
                        <div className={styles.trenchDetail}>
                          <h3 className={styles.trenchTitle}>
                            {selectedTrench.trench_name || `트렌치 ${selectedTrench.trench_number}`}
                          </h3>

                          <div className={styles.trenchInfo}>
                            <div className={styles.trenchDescription}>
                              <h4>설명</h4>
                              <p>{selectedTrench.description || '설명이 없습니다.'}</p>
                            </div>

                            <div className={styles.trenchDescription}>
                              <h4>주변의 경사나 지형적 조건</h4>
                              <p>{selectedTrench.slope_description || '-'}</p>
                            </div>

                            <div className={styles.trenchDescription}>
                              <h4>훼손 또는 환경적 상태</h4>
                              <p>{selectedTrench.disturbance_or_condition || '-'}</p>
                            </div>

                            <div className={styles.trenchInfoGrid}>
                              {selectedTrench.stratigraphy_count && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>층위 수:</span>
                                  <span className={styles.infoValue}>{selectedTrench.stratigraphy_count}층</span>
                                </div>
                              )}

                              {selectedTrench.length_m && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>길이:</span>
                                  <span className={styles.infoValue}>{selectedTrench.length_m}m</span>
                                </div>
                              )}

                              {selectedTrench.width_m && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>너비:</span>
                                  <span className={styles.infoValue}>{selectedTrench.width_m}m</span>
                                </div>
                              )}

                              {selectedTrench.depth_max_m && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>최대 깊이:</span>
                                  <span className={styles.infoValue}>{selectedTrench.depth_max_m}m</span>
                                </div>
                              )}

                              {selectedTrench.orientation && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>방향:</span>
                                  <span className={styles.infoValue}>{selectedTrench.orientation}</span>
                                </div>
                              )}

                              {selectedTrench.key_findings && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>주요 발견:</span>
                                  <span className={styles.infoValue}>{selectedTrench.key_findings}</span>
                                </div>
                              )}
                            </div>

                            {selectedTrench.remarks && (
                              <div className={styles.remarksSection}>
                                <h4>비고</h4>
                                <p>{selectedTrench.remarks}</p>
                              </div>
                            )}

                            {selectedTrench.images && selectedTrench.images.length > 0 && (
                              <div className={styles.imagesSection}>
                                <h4>이미지</h4>
                                <div className={styles.imageGrid}>
                                  {selectedTrench.images.map((img, index) => (
                                    <div key={index} className={styles.imageItem}>
                                      <img
                                        src={img}
                                        alt={`트렌치 ${selectedTrench.trench_number} 이미지 ${index + 1}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className={styles.trenchArtifacts}>
                              <h4>발견된 유물</h4>
                              {trenchArtifacts.length === 0 ? (
                                <p className={styles.empty}>등록된 유물이 없습니다.</p>
                              ) : (
                                <div className={styles.artifactTableContainer}>
                                  <table className={styles.dataTable}>
                                    <thead>
                                      <tr>
                                        <th>번호</th>
                                        <th>유물명</th>
                                        <th>유형</th>
                                        <th>세부 유형</th>
                                        <th>시대</th>
                                        <th>재질</th>
                                        <th>형태</th>
                                        <th>크기</th>
                                        <th>무게</th>
                                        <th>장식</th>
                                        <th>제작 기법</th>
                                        <th>보존 상태</th>
                                        <th>상세 설명</th>
                                        <th>기타</th>
                                        <th>이미지</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {trenchArtifacts.map(artifact => (
                                        <tr key={artifact.id}>
                                          <td>{artifact.artifact_number}</td>
                                          <td>{artifact.artifact_name || `유물 ${artifact.artifact_number}`}</td>
                                          <td>{artifact.artifact_type || '-'}</td>
                                          <td>{artifact.subtype_or_name || '-'}</td>
                                          <td>{artifact.associated_period || '-'}</td>
                                          <td>{artifact.material || '-'}</td>
                                          <td>{artifact.shape_or_morphology || '-'}</td>
                                          <td>{artifact.dimension_description || '-'}</td>
                                          <td>{artifact.weight_g || '-'}g</td>
                                          <td>{artifact.decoration_or_pattern || '-'}</td>
                                          <td>{artifact.manufacture_technique || '-'}</td>
                                          <td>{artifact.damage_or_condition || '-'}</td>
                                          <td>{artifact.description || '-'}</td>
                                          <td>{artifact.remarks || '-'}</td>
                                          <td>
                                            {artifact.images && artifact.images.length > 0 ? (
                                              <div className={styles.thumbnailContainer}>
                                                <img
                                                  src={artifact.images[0]}
                                                  alt={`${artifact.artifact_name || '유물'} 이미지`}
                                                  className={styles.thumbnail}
                                                />
                                              </div>
                                            ) : (
                                              '이미지 없음'
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noSelection}>
                          <p>좌측 목록에서 트렌치를 선택해주세요.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className={styles.featuresTab}>
                  <h2>유구 목록</h2>
                  <div className={styles.splitLayout}>
                    <div className={styles.splitLeft}>
                      {features.length === 0 ? (
                        <p className={styles.empty}>등록된 유구가 없습니다.</p>
                      ) : (
                        <div className={styles.tableContainer}>
                          <table className={styles.dataTable}>
                            <thead>
                              <tr>
                                <th>번호</th>
                                <th>유구명</th>
                                <th>유형</th>
                                <th>시대</th>
                              </tr>
                            </thead>
                            <tbody>
                              {features.map(feature => (
                                <tr
                                  key={feature.id}
                                  className={selectedFeature?.id === feature.id ? styles.activeRow : ''}
                                  onClick={() => handleSelectFeature(feature)}
                                >
                                  <td>{feature.feature_number}</td>
                                  <td>{feature.feature_name || `유구 ${feature.feature_number}`}</td>
                                  <td>
                                    {feature.feature_type ? (
                                      <span className={styles.featureTypeTag}>{feature.feature_type}</span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td>{feature.associated_period || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className={styles.splitRight}>
                      {selectedFeature ? (
                        <div className={styles.featureDetail}>
                          <h3 className={styles.featureTitle}>
                            {selectedFeature.feature_name || `유구 ${selectedFeature.feature_number}`}
                          </h3>

                          <div className={styles.featureInfo}>
                            <div className={styles.featureDescription}>
                              <h4>설명</h4>
                              <p>{selectedFeature.description || '설명이 없습니다.'}</p>
                            </div>

                            <div className={styles.featureInfoGrid}>
                              {selectedFeature.feature_type && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>유형:</span>
                                  <span className={styles.infoValue}>{selectedFeature.feature_type}</span>
                                </div>
                              )}

                              {selectedFeature.subtype_or_form && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>세부 유형:</span>
                                  <span className={styles.infoValue}>{selectedFeature.subtype_or_form}</span>
                                </div>
                              )}

                              {selectedFeature.associated_period && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>시대:</span>
                                  <span className={styles.infoValue}>{selectedFeature.associated_period}</span>
                                </div>
                              )}

                              {selectedFeature.construction_method && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>축조 방식:</span>
                                  <span className={styles.infoValue}>{selectedFeature.construction_method}</span>
                                </div>
                              )}

                              {selectedFeature.material && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>재질:</span>
                                  <span className={styles.infoValue}>{selectedFeature.material}</span>
                                </div>
                              )}

                              {selectedFeature.dimension_description && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>크기:</span>
                                  <span className={styles.infoValue}>{selectedFeature.dimension_description}</span>
                                </div>
                              )}

                              {selectedFeature.shape_plan && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>평면 형상:</span>
                                  <span className={styles.infoValue}>{selectedFeature.shape_plan}</span>
                                </div>
                              )}

                              {selectedFeature.shape_section && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>단면 형상:</span>
                                  <span className={styles.infoValue}>{selectedFeature.shape_section}</span>
                                </div>
                              )}

                              {selectedFeature.plan_summary && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>평면 구성 요약:</span>
                                  <span className={styles.infoValue}>{selectedFeature.plan_summary}</span>
                                </div>
                              )}

                              {selectedFeature.posthole_count && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>주공 수:</span>
                                  <span className={styles.infoValue}>{selectedFeature.posthole_count}</span>
                                </div>
                              )}

                              {selectedFeature.posthole_detail && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>주공 개요:</span>
                                  <span className={styles.infoValue}>{selectedFeature.posthole_detail}</span>
                                </div>
                              )}

                              {selectedFeature.structure_description && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>구조적 특징:</span>
                                  <span className={styles.infoValue}>{selectedFeature.structure_description}</span>
                                </div>
                              )}

                              {selectedFeature.location_context && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>위치:</span>
                                  <span className={styles.infoValue}>{selectedFeature.location_context}</span>
                                </div>
                              )}

                              {selectedFeature.stratigraphy_relation && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>기반:</span>
                                  <span className={styles.infoValue}>{selectedFeature.stratigraphy_relation}</span>
                                </div>
                              )}

                              {selectedFeature.interpretation && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>해석:</span>
                                  <span className={styles.infoValue}>{selectedFeature.interpretation}</span>
                                </div>
                              )}

                              {selectedFeature.artifact_presence && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>출토 유물 양상:</span>
                                  <span className={styles.infoValue}>{selectedFeature.artifact_presence}</span>
                                </div>
                              )}

                              {selectedFeature.disturbance_or_condition && (
                                <div className={styles.infoItem}>
                                  <span className={styles.infoLabel}>교란, 유실, 중첩 등의 상태:</span>
                                  <span className={styles.infoValue}>{selectedFeature.disturbance_or_condition}</span>
                                </div>
                              )}
                            </div>

                            {selectedFeature.remarks && (
                              <div className={styles.remarksSection}>
                                <h4>비고</h4>
                                <p>{selectedFeature.remarks}</p>
                              </div>
                            )}

                            {selectedFeature.images && selectedFeature.images.length > 0 && (
                              <div className={styles.imagesSection}>
                                <h4>이미지</h4>
                                <div className={styles.imageGrid}>
                                  {selectedFeature.images.map((img, index) => (
                                    <div key={index} className={styles.imageItem}>
                                      <img
                                        src={img}
                                        alt={`유구 ${selectedFeature.feature_number} 이미지 ${index + 1}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className={styles.featureArtifacts}>
                            <h4>발견된 유물</h4>
                            {featureArtifacts.length === 0 ? (
                              <p className={styles.empty}>등록된 유물이 없습니다.</p>
                            ) : (
                              <div className={styles.artifactTableContainer}>
                                <table className={styles.dataTable}>
                                  <thead>
                                    <tr>
                                      <th>번호</th>
                                      <th>유물명</th>
                                      <th>유형</th>
                                      <th>세부 유형</th>
                                      <th>시대</th>
                                      <th>재질</th>
                                      <th>형태</th>
                                      <th>크기</th>
                                      <th>무게</th>
                                      <th>장식</th>
                                      <th>제작 기법</th>
                                      <th>보존 상태</th>
                                      <th>상세 설명</th>
                                      <th>기타</th>
                                      <th>이미지</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {featureArtifacts.map(artifact => (
                                      <tr key={artifact.id}>
                                        <td>{artifact.artifact_number}</td>
                                        <td>{artifact.artifact_name || `유물 ${artifact.artifact_number}`}</td>
                                        <td>{artifact.artifact_type || '-'}</td>
                                        <td>{artifact.subtype_or_name || '-'}</td>
                                        <td>{artifact.associated_period || '-'}</td>
                                        <td>{artifact.material || '-'}</td>
                                        <td>{artifact.shape_or_morphology || '-'}</td>
                                        <td>{artifact.dimension_description || '-'}</td>
                                        <td>{artifact.weight_g || '-'}g</td>
                                        <td>{artifact.decoration_or_pattern || '-'}</td>
                                        <td>{artifact.manufacture_technique || '-'}</td>
                                        <td>{artifact.damage_or_condition || '-'}</td>
                                        <td>{artifact.description || '-'}</td>
                                        <td>{artifact.remarks || '-'}</td>
                                        <td>
                                          {artifact.images && artifact.images.length > 0 ? (
                                            <div className={styles.thumbnailContainer}>
                                              <img
                                                src={artifact.images[0]}
                                                alt={`${artifact.artifact_name || '유물'} 이미지`}
                                                className={styles.thumbnail}
                                              />
                                            </div>
                                          ) : (
                                            '이미지 없음'
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noSelection}>
                          <p>좌측 목록에서 유구를 선택해주세요.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.noSiteSelected}>
            <p>유적을 선택해주세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}
