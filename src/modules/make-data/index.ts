import { Artifact, ExcavatedSite, Feature, Trench } from '@/models/db.model';
import {
  PageType,
  PDFImageContentWithCaption,
  PDFImageContentWithDetailCaption,
  PDFTextByPage,
} from '@/models/pdf.model';
import { CompletionToken } from '@/models/token.model';
import makeExcavatedSiteData from '@/modules/make-data/makeExcavatedSiteData';
import makeTrenchFeatureArtifactData from '@/modules/make-data/makeTrenchFeatureArtifactData';

const makeData = async (
  reportId: string,
  texts: PDFTextByPage[],
  images: PDFImageContentWithCaption[],
  pageType: PageType,
  realFirstPage: number,
) => {
  const filteredImages: PDFImageContentWithDetailCaption[] = images.map(({ src, caption }) => ({
    src,
    caption: caption
      ? {
          ...caption,
          str: caption ? `${caption.prefix} ${caption.num}` : null,
          fullStr: caption ? `${caption.prefix} ${caption.num} ${caption.text}` : null,
        }
      : null,
  }));

  const consumeTokens: CompletionToken = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  const addConsumeTokens = (newConsumeTokens: CompletionToken) => {
    consumeTokens.promptTokens += newConsumeTokens.promptTokens;
    consumeTokens.completionTokens += newConsumeTokens.completionTokens;
    consumeTokens.totalTokens += newConsumeTokens.totalTokens;
  };

  const {
    excavatedSite,
    mainContentStartPage,
    mainContentNextChapterStartPage,
    consumeTokens: makeExcavatedSiteDataConsumeTokens,
  } = await makeExcavatedSiteData(reportId, texts, filteredImages, pageType, realFirstPage);

  addConsumeTokens(makeExcavatedSiteDataConsumeTokens);

  const {
    trenches,
    features,
    artifacts,
    consumeTokens: makeTrenchFeatureArtifactDataConsumeTokens,
  } = await makeTrenchFeatureArtifactData(
    excavatedSite.id,
    texts,
    filteredImages,
    mainContentStartPage as number,
    mainContentNextChapterStartPage as number,
  );

  addConsumeTokens(makeTrenchFeatureArtifactDataConsumeTokens);

  const result: {
    excavatedSite: ExcavatedSite;
    trenches: Trench[];
    features: Feature[];
    artifacts: Artifact[];
  } = {
    excavatedSite,
    trenches,
    features,
    artifacts,
  };

  return {
    result,
    consumeTokens,
  };
};

export default makeData;
