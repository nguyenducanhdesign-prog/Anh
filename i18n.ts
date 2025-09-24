import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';

const translations = {
  en: {
    title: "AI Image Editor",
    subtitle: "Upload an image, describe your edits, and let AI bring your vision to life.",
    lang_en: "EN",
    lang_vi: "VI",
    upload_placeholder: "Click, drop, or paste an image",
    prompt_placeholder: "e.g., 'add a cat wearing a wizard hat'",
    generate_button: "Generate",
    generating_button: "Generating...",
    history_title: "History",
    history_empty: "No edits yet. Your past generations will appear here.",
    view_button: "View",
    clear_history_button: "Clear History",

    loading_text: "AI is thinking... Your image is being generated.",
    error_title: "Oops! Something went wrong.",
    output_placeholder: "Your edited image will appear here.",
    original_title: "Original",
    result_title: "Result",
    download_button: "Download",
    share_button: "Share",
    awaiting_generation: "Awaiting generation...",
    
    tools: "Tools",
    undo: "Undo",
    redo: "Redo",
    use_mic: "Use Microphone",
    stop_mic: "Stop Microphone",
    
    reference_image: "Reference Image",
    upload_reference_placeholder: "Upload a style reference image (optional)",
    remove_reference: "Remove reference image",

    your_images: "Your Images",
    remove_image: "Remove image",
    image_name_placeholder: "Image name...",
    use_camera: "Use Camera",
    camera: "Camera",
    capture: "Capture",
    quick_actions: "Quick Actions",
    preset_remove_bg: "Remove Background",
    preset_studio_light: "Studio Lighting",
    preset_hd: "Enhance to HD",
    preset_cartoon: "Cartoon Style",
    ai_controls: "AI Controls",
    strength: "Strength",
    faithful: "Faithful",
    creative: "Creative",
    upscaling_button: "Upscaling...",
    upscale_failed: "Upscale failed. Please try again.",
    upscale_2x_tooltip: "Upscale 2x",
    upscale_4x_tooltip: "Upscale 4x",
    generate_more: "Generate More",
    generating_actions: "Generating...",
    actions_error: "Failed to load suggestions.",
    edit_this_result: "Edit this result",

    prompt_library_title: "Prompt Library",
    save_prompt: "Save Prompt",
    save_prompt_to_library: "Save Prompt to Library",
    prompt_name: "Prompt Name",
    prompt_name_placeholder: "e.g., 'Vintage Photo Effect'",
    save_button: "Save",
    cancel_button: "Cancel",
    search_prompts_placeholder: "Search prompts...",
    export_library: "Export",
    import_library: "Import",
    apply_prompt: "Apply Prompt",
    delete_prompt: "Delete Prompt",
    confirm_delete_prompt: "Are you sure you want to delete this prompt?",
    confirm_import: "This will merge the imported prompts with your current library. Are you sure?",
    no_prompts_saved: "No prompts saved yet. Save a prompt to see it here.",

    save_session: "Save Session",
    load_session: "Load Session",
    session_load_error: "Failed to load session. File may be invalid.",
  },
  vi: {
    title: "Trình chỉnh sửa ảnh AI",
    subtitle: "Tải ảnh lên, mô tả chỉnh sửa của bạn và để AI biến tầm nhìn của bạn thành hiện thực.",
    lang_en: "EN",
    lang_vi: "VI",
    upload_placeholder: "Nhấp, thả hoặc dán ảnh",
    prompt_placeholder: "ví dụ: 'thêm một con mèo đội mũ phù thủy'",
    generate_button: "Tạo ảnh",
    generating_button: "Đang tạo...",
    history_title: "Lịch sử",
    history_empty: "Chưa có chỉnh sửa nào. Các thế hệ trước của bạn sẽ xuất hiện ở đây.",
    view_button: "Xem",
    clear_history_button: "Xóa lịch sử",

    loading_text: "AI đang suy nghĩ... Ảnh của bạn đang được tạo.",
    error_title: "Ôi! Đã có lỗi xảy ra.",
    output_placeholder: "Ảnh đã chỉnh sửa của bạn sẽ xuất hiện ở đây.",
    original_title: "Bản gốc",
    result_title: "Kết quả",
    download_button: "Tải xuống",
    share_button: "Chia sẻ",
    awaiting_generation: "Đang chờ tạo...",

    tools: "Công cụ",
    undo: "Hoàn tác",
    redo: "Làm lại",
    use_mic: "Dùng micrô",
    stop_mic: "Dừng micrô",
    
    reference_image: "Ảnh tham khảo",
    upload_reference_placeholder: "Tải lên ảnh tham khảo phong cách (tùy chọn)",
    remove_reference: "Xóa ảnh tham khảo",
    
    your_images: "Ảnh của bạn",
    remove_image: "Xóa ảnh",
    image_name_placeholder: "Tên ảnh...",
    use_camera: "Dùng máy ảnh",
    camera: "Máy ảnh",
    capture: "Chụp",
    quick_actions: "Tác vụ nhanh",
    preset_remove_bg: "Xóa nền",
    preset_studio_light: "Ánh sáng studio",
    preset_hd: "Nâng cấp HD",
    preset_cartoon: "Phong cách hoạt hình",
    ai_controls: "Điều khiển AI",
    strength: "Mức độ",
    faithful: "Giống thật",
    creative: "Sáng tạo",
    upscaling_button: "Đang nâng cấp...",
    upscale_failed: "Nâng cấp thất bại. Vui lòng thử lại.",
    upscale_2x_tooltip: "Nâng cấp x2",
    upscale_4x_tooltip: "Nâng cấp x4",
    generate_more: "Tạo thêm",
    generating_actions: "Đang tạo...",
    actions_error: "Tải gợi ý thất bại.",
    edit_this_result: "Chỉnh sửa kết quả này",

    prompt_library_title: "Thư viện Lời nhắc",
    save_prompt: "Lưu lời nhắc",
    save_prompt_to_library: "Lưu lời nhắc vào thư viện",
    prompt_name: "Tên lời nhắc",
    prompt_name_placeholder: "ví dụ: 'Hiệu ứng ảnh cổ điển'",
    save_button: "Lưu",
    cancel_button: "Hủy",
    search_prompts_placeholder: "Tìm kiếm lời nhắc...",
    export_library: "Xuất",
    import_library: "Nhập",
    apply_prompt: "Áp dụng",
    delete_prompt: "Xóa lời nhắc",
    confirm_delete_prompt: "Bạn có chắc chắn muốn xóa lời nhắc này không?",
    confirm_import: "Thao tác này sẽ hợp nhất các lời nhắc đã nhập với thư viện hiện tại của bạn. Bạn có chắc không?",
    no_prompts_saved: "Chưa có lời nhắc nào được lưu. Hãy lưu một lời nhắc để xem nó ở đây.",

    save_session: "Lưu phiên",
    load_session: "Tải phiên",
    session_load_error: "Tải phiên thất bại. Tệp có thể không hợp lệ.",
  },
};

type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useLocalStorage<Language>('language', 'en');

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key];
  };

  // FIX: Replaced JSX with React.createElement to prevent syntax errors in a .ts file.
  return React.createElement(LanguageContext.Provider, { value: { language, setLanguage, t } }, children);
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};