import { zfd } from "zod-form-data";

export const importRequestSchema = zfd.formData({
  collectiviteId: zfd.numeric(),
  planName: zfd.text(),
  planType: zfd.numeric().optional(),
  file: zfd.file(),
});
