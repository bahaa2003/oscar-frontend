// Save and publish the same server-validated snapshot. A missing/failed response
// must never be treated as a successful publish or applied to the public theme.
const unconfirmed = (message) => Object.assign(new Error(message), { code: 'THEME_RESPONSE_INVALID' });
export async function publishThemeDraft(api, configuration) {
  const saved = await api.saveDraft(configuration);
  if (saved?.draft?.schemaVersion !== 2) throw unconfirmed('لم يؤكد الخادم حفظ المسودة.');
  const result = await api.publish(saved.draft);
  if (result?.published?.schemaVersion !== 2 || !Number.isSafeInteger(result.version)) {
    throw unconfirmed('لم يؤكد الخادم نشر الثيم.');
  }
  return result;
}
