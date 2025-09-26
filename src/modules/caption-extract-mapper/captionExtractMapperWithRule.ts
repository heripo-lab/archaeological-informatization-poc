import { PDFCaption, PDFData, PDFImageContentWithCaption } from '@/models/pdf.model';

const captionExtractMapperWithRule = (pdfData: PDFData) => {
  // 페이지별로 이미지 그룹화
  const imagesByPage: Record<number, typeof pdfData.images> = {};
  pdfData.images.forEach(image => {
    if (!imagesByPage[image.page]) {
      imagesByPage[image.page] = [];
    }
    imagesByPage[image.page].push(image);
  });

  // 페이지별로 텍스트 그룹화
  const textsByPage: Record<number, typeof pdfData.texts> = {};
  pdfData.texts.forEach(text => {
    if (!textsByPage[text.page]) {
      textsByPage[text.page] = [];
    }
    textsByPage[text.page].push(text);
  });

  // 캡션 패턴을 미리 정의
  const captionPatterns = [
    // 기본 패턴: "사진 1", "도면 2", "표 3" 등
    /^(사진|도면|표|그림|지도|위성사진|항공사진|도판|도|삽도|일러스트|이미지|사례|차트)\s*(\d+(?:[-.]\d+)?)\s*(.+)?$/,

    // 번호만 있는 형식: "1.", "2.", "Fig.1", "Fig 1" 등
    /^(?:Fig\.?|Figure)?\s*(\d+)(?:\.|\)|\s)?\s*(.+)?$/i,

    // 괄호로 번호가 묶인 형식: "(1)", "[그림 1]" 등
    /[\[\(](?:(사진|도면|표|그림|지도|Fig|Figure))?\s*(\d+(?:[-.]\d+)?)[\]\)](?:\s+(.+))?$/i,
  ];

  // 타입을 명시적으로 PDFImageContentWithCaption으로 변환
  const processedImages: PDFImageContentWithCaption[] = pdfData.images.map(img => ({
    ...img,
    caption: null,
  }));

  // 페이지별로 처리
  Object.entries(imagesByPage).forEach(([pageStr, pageImages]) => {
    const page = parseInt(pageStr);
    const pageTexts = textsByPage[page] || [];

    // 페이지의 모든 텍스트에서 캡션 후보 찾기
    const captionCandidates: {
      text: (typeof pageTexts)[0];
      pattern: RegExp;
      match: RegExpMatchArray;
      prefix: string;
      num: number;
      captionText: string;
    }[] = [];

    pageTexts.forEach(text => {
      for (const pattern of captionPatterns) {
        const match = text.text.match(pattern);
        if (match) {
          let prefix = '그림';
          let num = 0;
          let captionText = '';

          if (
            pattern.toString().includes('Fig') &&
            !match[1]?.match(/사진|도면|표|그림|지도|위성사진|항공사진|도판|도|삽도/)
          ) {
            // Fig 패턴
            prefix = '그림';
            // match[1]이 undefined일 수 있으므로 안전하게 처리
            num = match[1] ? parseFloat(match[1].replace('-', '.')) : 0;
            captionText = match[2]?.trim() || '';
          } else if (pattern.toString().includes('[\[\(]')) {
            // 괄호 패턴
            prefix = match[1] || '그림';
            // match[2]가 undefined일 수 있으므로 안전하게 처리
            num = match[2] ? parseFloat(match[2].replace('-', '.')) : 0;
            captionText = match[3]?.trim() || '';
          } else {
            // 기본 패턴
            prefix = match[1] || '그림';
            // match[2]가 undefined일 수 있으므로 안전하게 처리
            num = match[2] ? parseFloat(match[2].replace('-', '.')) : 0;
            captionText = match[3]?.trim() || '';
          }

          captionCandidates.push({
            text,
            pattern,
            match,
            prefix,
            num,
            captionText,
          });
          break; // 첫 번째 매칭되는 패턴만 사용
        }
      }
    });

    // 각 이미지에 대해 처리
    pageImages.forEach(image => {
      // 이미지 중심 좌표 계산
      const imageCenterX = (image.bbox.x0 + image.bbox.x1) / 2;
      const imageCenterY = (image.bbox.top + image.bbox.bottom) / 2;

      // 이미지와 캡션 간 거리 계산
      const imageDistances = captionCandidates.map(candidate => {
        const textCenterX = (candidate.text.bbox.x0 + candidate.text.bbox.x1) / 2;
        const textCenterY = (candidate.text.bbox.top + candidate.text.bbox.bottom) / 2;

        // 거리 계산
        const distance = Math.sqrt(Math.pow(textCenterX - imageCenterX, 2) + Math.pow(textCenterY - imageCenterY, 2));

        // 가중치 적용: 이미지 아래 텍스트에 더 높은 우선순위
        const weightedDistance =
          candidate.text.bbox.top > image.bbox.bottom
            ? distance * 0.8 // 이미지 아래에 있는 경우 거리를 줄여서 우선순위 높임
            : distance;

        return {
          candidate,
          distance: weightedDistance,
        };
      });

      // 거리순으로 정렬
      imageDistances.sort((a, b) => a.distance - b.distance);

      // 이미지의 인덱스 찾기
      const imageIndex = processedImages.findIndex(img => img.src === image.src && img.page === image.page);

      // 캡션 할당
      if (imageDistances.length > 0 && imageIndex !== -1) {
        const nearestCaption = imageDistances[0];

        // 거리가 적당히 가까운 경우만 캡션으로 인정 (페이지 크기에 따라 조정 필요)
        if (nearestCaption.distance < 300) {
          processedImages[imageIndex].caption = {
            prefix: nearestCaption.candidate.prefix,
            num: nearestCaption.candidate.num,
            text: nearestCaption.candidate.captionText,
          };
        }
      }
    });

    // 같은 캡션을 공유해야 하는 이미지들 처리
    // 번호가 같은 캡션이 있는 이미지들을 그룹화
    const captionGroups = new Map<string, PDFImageContentWithCaption[]>();

    processedImages
      .filter(img => img.page === page && img.caption !== null)
      .forEach(img => {
        if (img.caption) {
          const key = `${img.caption.prefix}-${img.caption.num}`;
          if (!captionGroups.has(key)) {
            captionGroups.set(key, []);
          }
          captionGroups.get(key)?.push(img);
        }
      });

    // 같은 키의 이미지들에 동일한 캡션 적용
    captionGroups.forEach((images, key) => {
      if (images.length > 1) {
        // 가장 좋은 캡션 찾기 (보통 텍스트가 더 긴 것이 더 자세한 캡션)
        const bestCaption = images
          .map(img => img.caption)
          .reduce(
            (best, current) => {
              if (!best || (current && current.text.length > best.text.length)) {
                return current;
              }
              return best;
            },
            null as PDFCaption | null,
          );

        // 모든 같은 그룹 이미지에 동일한 최상의 캡션 적용
        images.forEach(img => {
          const imgIndex = processedImages.findIndex(
            processedImg => processedImg.src === img.src && processedImg.page === img.page,
          );
          if (imgIndex !== -1 && bestCaption) {
            processedImages[imgIndex].caption = bestCaption;
          }
        });
      }
    });
  });

  return {
    texts: pdfData.texts,
    images: processedImages,
  };
};

export default captionExtractMapperWithRule;
