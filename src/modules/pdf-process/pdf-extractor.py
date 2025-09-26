import json
import argparse
import os
import pdfplumber
import warnings

# 경고 메시지 무시
warnings.filterwarnings("ignore", category=UserWarning)

# TODO: PoC 이후에는 멀티 스레드 처리로 변경
def process_pdf(pdf_path, report_id):
    if not os.path.exists(pdf_path):
        return {
            "success": False,
            "error": f"File not found: {pdf_path}"
        }

    text_contents = []
    images_metadata = []
    output_image_dir = os.path.abspath(f"public/pdf-images/{report_id}")

    # 이미지 저장 디렉토리 생성 (없으면)
    os.makedirs(output_image_dir, exist_ok=True)

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                # CropBox 경고 등을 피하기 위해 page.bbox가 None일 경우 page.mediabox 사용 고려
                # pdfplumber는 기본적으로 mediabox를 기준으로 좌표를 사용하므로 page.bbox 조작은 신중해야 함
                # 여기서는 원본 코드의 page.bbox 설정을 유지하되, 이미지 처리에 더 집중합니다.

                # 텍스트 추출 및 단위별 처리
                page_text = page.extract_text()
                if page_text:
                    lines = page_text.split('\n')  # 텍스트를 \n 기준으로 나눔
                    for line in lines:
                        words = page.extract_words()  # 단어별 좌표 추출
                        line_words = [word for word in words if word["text"] in line]

                        if line_words:
                            text_contents.append({
                                "text": line,  # 단위 텍스트
                                "page": i,  # 0-indexed page number
                                "bbox": {
                                    "x0": round(line_words[0]["x0"], 1),  # 첫 번째 단어의 x0
                                    "top": round(line_words[0]["top"], 1),  # 첫 번째 단어의 top
                                    "x1": round(line_words[-1]["x1"], 1),  # 마지막 단어의 x1
                                    "bottom": round(line_words[-1]["bottom"], 1)  # 마지막 단어의 bottom
                                }  # 텍스트의 좌표
                            })

                # 이미지 추출
                # page.images에는 해당 페이지의 이미지 객체 정보가 담겨 있음
                for img_index, img in enumerate(page.images):
                    # 이미지 객체의 바운딩 박스 정보 사용
                    # (x0, top, x1, bottom) 형식의 튜플
                    bbox = {
                        "x0": round(img['x0'], 1),
                        "top": round(img['top'], 1),
                        "x1": round(img['x1'], 1),
                        "bottom": round(img['bottom'], 1)
                    }

                    try:
                        # 페이지를 이미지의 바운딩 박스만큼 자르기
                        cropped_page = page.crop((bbox["x0"], bbox["top"], bbox["x1"], bbox["bottom"]))

                        # 자른 이미지를 Pillow Image 객체로 변환
                        img_obj = cropped_page.to_image(resolution=150) # 해상도 조절 가능

                        # 파일명 및 경로 설정
                        image_filename = f"page{i + 1}_img{img_index + 1}.png"
                        image_save_path = os.path.join(output_image_dir, image_filename)

                        # 이미지 저장
                        img_obj.save(image_save_path, format="PNG")

                        # JSON에 포함될 src 경로
                        src_path = f"/pdf-images/{report_id}/{image_filename}"

                        images_metadata.append({
                            "src": src_path,
                            "page": i, # 0-indexed page number
                            "bbox": bbox, # PDF 좌표계 기준 바운딩 박스 (객체 형태)
                        })
                    except Exception as img_error:
                        # 이미지 처리 중 오류 발생 시 해당 페이지와 이미지 인덱스 정보 로깅
                        # print(f"Error processing image on page {i + 1}, img {img_index + 1}: {img_error}")
                        continue

        return {
            "success": True,
            "data": {
                "texts": text_contents,  # 단위 텍스트와 좌표 포함
                "images": images_metadata
            }
        }
    except Exception as e:
        # 예외 발생 시 어떤 파일, 어떤 페이지에서 문제 발생했는지 로깅하면 좋음
        # print(f"Error processing PDF '{pdf_path}': {e}")
        return {
            "success": False,
            "error": f"Error processing PDF '{os.path.basename(pdf_path)}': {str(e)}"
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PDF 텍스트 및 이미지 추출기")
    parser.add_argument("pdf_path", help="처리할 PDF 파일의 경로")
    parser.add_argument("report_id", help="리포트 ID")
    args = parser.parse_args()

    result = process_pdf(args.pdf_path, args.report_id)
    print(json.dumps(result, ensure_ascii=False, indent=2)) # 가독성을 위해 indent 추가

