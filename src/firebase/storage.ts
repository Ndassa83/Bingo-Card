const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Cloudinary upload failed: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`
    );
  }

  const data = await res.json() as { secure_url: string };
  // Validate URL origin before returning
  const url = data.secure_url.replace("/upload/", "/upload/c_fill,ar_1:1/");
  const origin = new URL(url).hostname;
  if (!origin.endsWith("cloudinary.com")) {
    throw new Error("Unexpected image URL origin — upload rejected.");
  }
  return url;
};

// Signatures unchanged — callers don't need to be updated
export const uploadGoalImage = async (
  _userId: string,
  _cardId: string,
  _goalIndex: number,
  file: File
): Promise<string> => uploadToCloudinary(file);

export const uploadFreeCellImage = async (
  _userId: string,
  _cardId: string,
  file: File
): Promise<string> => uploadToCloudinary(file);

// Cloudinary deletion requires a signed server-side request; no-op for now
export const deleteGoalImage = async (
  _userId: string,
  _cardId: string,
  _goalIndex: number
): Promise<void> => {};
