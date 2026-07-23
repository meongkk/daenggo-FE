import { useEffect, useMemo } from 'react';

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * 게시글 수정 화면에서 기존 이미지와 새 이미지 파일을 함께 관리한다.
 */
export default function BoardImageEditor({
    existingImageUrls,
    newImageFiles,
    onExistingImageUrlsChange,
    onNewImageFilesChange,
    onValidationError,
    disabled,
}) {
    const totalImageCount = existingImageUrls.length + newImageFiles.length;

    // 브라우저에서 새 파일을 미리 볼 수 있는 임시 주소를 만든다.
    const newImagePreviews = useMemo(
        () => newImageFiles.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        })),
        [newImageFiles]
    );

    // 컴포넌트가 사라지거나 파일이 바뀌면 임시 주소를 정리한다.
    useEffect(() => (
        () => newImagePreviews.forEach(({ url }) => URL.revokeObjectURL(url))
    ), [newImagePreviews]);

    const handleImageChange = (event) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        event.target.value = '';

        if (totalImageCount + selectedFiles.length > MAX_IMAGE_COUNT) {
            onValidationError(`사진은 최대 ${MAX_IMAGE_COUNT}장까지 등록할 수 있어요.`);
            return;
        }

        const hasInvalidType = selectedFiles.some(
            (file) => !ALLOWED_IMAGE_TYPES.includes(file.type)
        );
        if (hasInvalidType) {
            onValidationError('JPG, PNG, WEBP 형식의 사진만 등록할 수 있어요.');
            return;
        }

        const hasOversizedFile = selectedFiles.some(
            (file) => file.size > MAX_IMAGE_SIZE
        );
        if (hasOversizedFile) {
            onValidationError('사진 한 장의 크기는 10MB 이하여야 해요.');
            return;
        }

        onNewImageFilesChange([...newImageFiles, ...selectedFiles]);
        onValidationError('');
    };

    const removeExistingImage = (imageIndex) => {
        onExistingImageUrlsChange(
            existingImageUrls.filter((_, index) => index !== imageIndex)
        );
    };

    const removeNewImage = (imageIndex) => {
        onNewImageFilesChange(
            newImageFiles.filter((_, index) => index !== imageIndex)
        );
    };

    return (
        <section className="image-upload-section" aria-labelledby="edit-image-title">
            <div className="image-upload-heading">
                <span id="edit-image-title">사진</span>
                <span>{totalImageCount}/{MAX_IMAGE_COUNT}</span>
            </div>

            <input
                id="edit-board-images"
                className="sr-only"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                multiple
                onChange={handleImageChange}
                disabled={disabled}
            />

            {totalImageCount === 0 ? (
                <label className="image-upload-box" htmlFor="edit-board-images">
                    <span className="image-upload-plus" aria-hidden="true">＋</span>
                    <span className="image-upload-text">사진 추가</span>
                </label>
            ) : (
                <div className="image-preview-list">
                    {existingImageUrls.map((imageUrl, index) => (
                        <div className="image-preview-item" key={`${imageUrl}-${index}`}>
                            <img src={imageUrl} alt={`기존 게시글 사진 ${index + 1}`} />
                            <button
                                type="button"
                                className="image-remove-button"
                                onClick={() => removeExistingImage(index)}
                                disabled={disabled}
                                aria-label={`기존 사진 ${index + 1} 삭제`}
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {newImagePreviews.map(({ file, url }, index) => (
                        <div className="image-preview-item" key={`${file.name}-${file.lastModified}-${index}`}>
                            <img src={url} alt={`새로 선택한 사진 ${index + 1}`} />
                            <button
                                type="button"
                                className="image-remove-button"
                                onClick={() => removeNewImage(index)}
                                disabled={disabled}
                                aria-label={`새 사진 ${index + 1} 삭제`}
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {totalImageCount < MAX_IMAGE_COUNT && (
                        <label className="image-add-button" htmlFor="edit-board-images" aria-label="사진 더 추가">
                            <span aria-hidden="true">＋</span>
                        </label>
                    )}
                </div>
            )}

            <p className="image-upload-guide">JPG, PNG, WEBP · 최대 5장 · 장당 최대 10MB</p>
        </section>
    );
}
