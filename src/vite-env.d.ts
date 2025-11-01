/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
